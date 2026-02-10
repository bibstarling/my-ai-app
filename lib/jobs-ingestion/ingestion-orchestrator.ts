/**
 * Ingestion Orchestrator
 * Manages all job ingestion workers and coordinates the pipeline
 * Now dynamically loads sources from database (both built-in and custom)
 */

import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { BaseJobWorker, IngestionResult } from './base-worker';
import { JobSourceEnum } from '@/lib/types/job-intelligence';
import { SourcesService, SourceConfig } from './sources-service';

export interface OrchestrationResult {
  total_sources: number;
  successful_sources: number;
  total_jobs_fetched: number;
  total_jobs_stored: number;
  source_results: Record<string, IngestionResult>; // Changed from JobSourceEnum to string to support custom sources
  errors: string[];
  duration_ms: number;
}

export class IngestionOrchestrator {
  private sourcesService: SourcesService;
  
  constructor() {
    this.sourcesService = new SourcesService();
  }
  
  /**
   * Run ingestion for all enabled sources (both built-in and custom)
   */
  async runAll(): Promise<OrchestrationResult> {
    const startTime = Date.now();
    
    // Fetch enabled sources from database
    const sources = await this.sourcesService.getEnabledSources();
    
    const result: OrchestrationResult = {
      total_sources: sources.length,
      successful_sources: 0,
      total_jobs_fetched: 0,
      total_jobs_stored: 0,
      source_results: {},
      errors: [],
      duration_ms: 0,
    };
    
    console.log(`[Orchestrator] Starting ingestion for ${sources.length} enabled sources...`);
    
    if (sources.length === 0) {
      console.warn('[Orchestrator] No enabled sources found!');
      result.duration_ms = Date.now() - startTime;
      return result;
    }
    
    // Run sources in parallel
    const promises = sources.map(async (source) => {
      try {
        const worker = this.sourcesService.createWorker(source);
        
        if (!worker) {
          const errorMsg = `Failed to create worker for ${source.name}`;
          console.error(`[Orchestrator] ${errorMsg}`);
          result.errors.push(`${source.name}: ${errorMsg}`);
          
          result.source_results[source.source_key] = {
            success: false,
            jobs_fetched: 0,
            jobs_processed: 0,
            errors: [errorMsg],
            duration_ms: 0,
          };
          
          await this.sourcesService.updateSyncStatus(source.source_key, 'failed', 0, errorMsg);
          return;
        }
        
        console.log(`[Orchestrator] Running ${source.name} (${source.source_type})...`);
        
        const sourceResult = await worker.ingest();
        result.source_results[source.source_key] = sourceResult;
        
        if (sourceResult.success) {
          result.successful_sources++;
          await this.sourcesService.updateSyncStatus(
            source.source_key, 
            'success', 
            sourceResult.jobs_fetched
          );
        } else {
          const errorMsg = sourceResult.errors.join('; ');
          await this.sourcesService.updateSyncStatus(
            source.source_key, 
            'failed', 
            sourceResult.jobs_fetched,
            errorMsg
          );
        }
        
        result.total_jobs_fetched += sourceResult.jobs_fetched;
        
        // Also update legacy job_sync_metrics for backward compatibility
        await this.updateSyncMetrics(source.source_key as any, sourceResult);
        
      } catch (err) {
        const error = err as Error;
        console.error(`[Orchestrator] Fatal error for ${source.name}:`, error);
        result.errors.push(`${source.name}: ${error.message}`);
        
        result.source_results[source.source_key] = {
          success: false,
          jobs_fetched: 0,
          jobs_processed: 0,
          errors: [error.message],
          duration_ms: 0,
        };
        
        await this.sourcesService.updateSyncStatus(
          source.source_key, 
          'failed', 
          0,
          error.message
        );
      }
    });
    
    await Promise.all(promises);
    
    result.duration_ms = Date.now() - startTime;
    
    console.log(`[Orchestrator] Ingestion complete: ${result.successful_sources}/${result.total_sources} sources successful`);
    console.log(`[Orchestrator] Total jobs fetched: ${result.total_jobs_fetched}`);
    
    return result;
  }
  
  /**
   * Run ingestion for a specific source by source_key
   */
  async runSource(sourceKey: string): Promise<IngestionResult> {
    const sourceConfig = await this.sourcesService.getSource(sourceKey);
    
    if (!sourceConfig) {
      throw new Error(`Source not found: ${sourceKey}`);
    }
    
    const worker = this.sourcesService.createWorker(sourceConfig);
    
    if (!worker) {
      throw new Error(`Failed to create worker for: ${sourceKey}`);
    }
    
    console.log(`[Orchestrator] Running ingestion for ${sourceConfig.name}...`);
    const result = await worker.ingest();
    
    // Update sync status
    await this.sourcesService.updateSyncStatus(
      sourceKey,
      result.success ? 'success' : 'failed',
      result.jobs_fetched,
      result.errors.join('; ') || undefined
    );
    
    // Update legacy sync metrics
    await this.updateSyncMetrics(sourceKey as any, result);
    
    return result;
  }
  
  /**
   * Update sync metrics in database
   */
  private async updateSyncMetrics(source: JobSourceEnum, result: IngestionResult): Promise<void> {
    try {
      const supabase = getSupabaseServiceRole();
      
      const { error } = await supabase
        .from('job_sync_metrics')
        .upsert({
          source,
          last_sync_at: new Date().toISOString(),
          last_sync_status: result.success ? 'success' : 'failed',
          jobs_fetched: result.jobs_fetched,
          jobs_upserted: result.jobs_processed,
          duplicates_found: 0,  // Updated by deduplication service
          errors_count: result.errors.length,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'source',
        });
      
      if (error) {
        console.error(`[Orchestrator] Error updating sync metrics for ${source}:`, error);
      }
    } catch (err) {
      console.error(`[Orchestrator] Failed to update sync metrics:`, err);
    }
  }
  
  /**
   * Get health status of all sources
   */
  async getHealthStatus(): Promise<Record<JobSourceEnum, {
    last_sync_at?: string;
    last_sync_status?: string;
    jobs_fetched: number;
    errors_count: number;
  }>> {
    const supabase = getSupabaseServiceRole();
    
    const { data, error } = await supabase
      .from('job_sync_metrics')
      .select('*');
    
    if (error) {
      console.error('[Orchestrator] Error fetching health status:', error);
      return {} as Record<JobSourceEnum, {
        last_sync_at?: string;
        last_sync_status?: string;
        jobs_fetched: number;
        errors_count: number;
      }>;
    }
    
    const status = {} as Record<JobSourceEnum, {
      last_sync_at?: string;
      last_sync_status?: string;
      jobs_fetched: number;
      errors_count: number;
    }>;
    
    for (const metric of data || []) {
      status[metric.source as JobSourceEnum] = {
        last_sync_at: metric.last_sync_at,
        last_sync_status: metric.last_sync_status,
        jobs_fetched: metric.jobs_fetched || 0,
        errors_count: metric.errors_count || 0,
      };
    }
    
    return status;
  }
}
