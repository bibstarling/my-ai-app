/**
 * Pipeline Service
 * Orchestrates the complete ingestion pipeline:
 * Fetch → Normalize → Deduplicate → Store
 */

import { IngestionOrchestrator } from './ingestion-orchestrator';
import { NormalizationService } from './normalization-service';
import { DeduplicationService } from './deduplication-service';
import { RawJobPosting, JobSourceEnum } from '@/lib/types/job-intelligence';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export interface PipelineResult {
  success: boolean;
  jobs_fetched: number;
  jobs_normalized: number;
  jobs_created: number;
  jobs_deduplicated: number;
  errors: string[];
  duration_ms: number;
}

export class PipelineService {
  private orchestrator: IngestionOrchestrator;
  private normalizer: NormalizationService;
  private deduplicator: DeduplicationService;
  
  constructor() {
    this.orchestrator = new IngestionOrchestrator();
    this.normalizer = new NormalizationService();
    this.deduplicator = new DeduplicationService();
  }
  
  /**
   * Run the complete pipeline for all sources
   */
  async runPipeline(): Promise<PipelineResult> {
    const startTime = Date.now();
    const result: PipelineResult = {
      success: false,
      jobs_fetched: 0,
      jobs_normalized: 0,
      jobs_created: 0,
      jobs_deduplicated: 0,
      errors: [],
      duration_ms: 0,
    };
    
    try {
      console.log('[Pipeline] Starting job ingestion pipeline...');
      
      // Step 1: Fetch jobs from all sources
      const ingestionResult = await this.orchestrator.runAll();
      result.jobs_fetched = ingestionResult.total_jobs_fetched;
      
      if (ingestionResult.errors.length > 0) {
        result.errors.push(...ingestionResult.errors);
      }
      
      // Step 2: Process raw jobs directly from ingestion
      // The workers already stored jobs in job_sources, now process them into canonical jobs
      for (const [source, sourceResult] of Object.entries(ingestionResult.source_results)) {
        if (!sourceResult.success || !sourceResult.raw_jobs || sourceResult.raw_jobs.length === 0) {
          console.log(`[Pipeline] Skipping ${source} - no jobs to process`);
          continue;
        }
        
        try {
          console.log(`[Pipeline] Processing ${sourceResult.raw_jobs.length} jobs from ${source}...`);
          
          let created = 0;
          let deduplicated = 0;
          
          for (const rawJob of sourceResult.raw_jobs) {
            try {
              const processResult = await this.processRawJob(rawJob);
              
              if (processResult.created) {
                created++;
              } else {
                deduplicated++;
              }
            } catch (err) {
              console.error(`[Pipeline] Error processing job ${rawJob.source_job_id}:`, err);
              // Continue processing other jobs
            }
          }
          
          console.log(`[Pipeline] ${source} complete: ${created} created, ${deduplicated} deduplicated`);
          
          result.jobs_created += created;
          result.jobs_deduplicated += deduplicated;
          result.jobs_normalized += sourceResult.raw_jobs.length;
          
        } catch (err) {
          const error = err as Error;
          console.error(`[Pipeline] Error processing ${source}:`, error);
          result.errors.push(`${source}: ${error.message}`);
        }
      }
      
      result.success = result.errors.length < result.jobs_fetched * 0.5;
      
      console.log('[Pipeline] Pipeline complete');
      console.log(`[Pipeline] Fetched: ${result.jobs_fetched}, Created: ${result.jobs_created}, Deduplicated: ${result.jobs_deduplicated}`);
      
    } catch (err) {
      const error = err as Error;
      console.error('[Pipeline] Fatal pipeline error:', error);
      result.errors.push(`Fatal: ${error.message}`);
    } finally {
      result.duration_ms = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Process jobs from a specific source
   */
  private async processSourceJobs(source: JobSourceEnum): Promise<{ processed: number; created: number; deduplicated: number }> {
    console.log(`[Pipeline] Processing jobs from ${source}...`);
    
    const supabase = getSupabaseServiceRole();
    
    // Get unprocessed jobs from this source
    const { data: rawJobs, error } = await supabase
      .from('job_sources')
      .select('*')
      .eq('source', source)
      .order('fetched_at', { ascending: false })
      .limit(500); // Process up to 500 per source
    
    if (error) {
      console.error(`[Pipeline] Error fetching raw jobs from ${source}:`, error);
      throw error;
    }
    
    if (!rawJobs || rawJobs.length === 0) {
      console.log(`[Pipeline] No raw jobs found for ${source}`);
      return { processed: 0, created: 0, deduplicated: 0 };
    }
    
    console.log(`[Pipeline] Processing ${rawJobs.length} jobs from ${source}...`);
    
    let created = 0;
    let deduplicated = 0;
    let processed = 0;
    
    for (const rawJob of rawJobs) {
      try {
        const rawPosting: RawJobPosting = {
          source: rawJob.source as JobSourceEnum,
          source_job_id: rawJob.source_job_id,
          source_url: rawJob.source_url,
          raw_data: rawJob.raw_payload as Record<string, unknown>,
          fetched_at: rawJob.fetched_at || new Date().toISOString(),
        };
        
        const result = await this.processRawJob(rawPosting);
        processed++;
        
        if (result.created) {
          created++;
        } else {
          deduplicated++;
        }
      } catch (err) {
        console.error(`[Pipeline] Error processing job ${rawJob.source_job_id}:`, err);
        // Continue processing other jobs
      }
    }
    
    console.log(`[Pipeline] ${source} complete: ${created} created, ${deduplicated} deduplicated out of ${processed} processed`);
    
    return { processed, created, deduplicated };
  }
  
  /**
   * Process a single raw job through the pipeline
   */
  async processRawJob(raw: RawJobPosting): Promise<{ created: boolean; job_id?: string }> {
    try {
      // Step 1: Normalize
      const normalized = this.normalizer.normalize(raw);
      
      // Step 2: Check for duplicates
      const dedupeResult = await this.deduplicator.checkDuplicate(normalized);
      
      if (dedupeResult.is_duplicate && dedupeResult.canonical_job_id) {
        // Merge into existing job
        await this.deduplicator.mergeDuplicate(
          dedupeResult.canonical_job_id,
          normalized,
          dedupeResult.similarity_score || 1.0,
          dedupeResult.merge_reason || 'duplicate'
        );
        
        return {
          created: false,
          job_id: dedupeResult.canonical_job_id,
        };
      } else {
        // Create new canonical job
        const jobId = await this.deduplicator.createCanonicalJob(normalized);
        
        return {
          created: true,
          job_id: jobId,
        };
      }
    } catch (err) {
      console.error('[Pipeline] Error processing raw job:', err);
      throw err;
    }
  }
}
