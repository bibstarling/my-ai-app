/**
 * Deduplication Service
 * Merges duplicate job postings and maintains audit trail
 * Uses deterministic fingerprinting and similarity scoring
 */

import { NormalizedJob } from '@/lib/types/job-intelligence';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import crypto from 'crypto';

export interface DeduplicationResult {
  is_duplicate: boolean;
  canonical_job_id?: string;
  similarity_score?: number;
  merge_reason?: string;
}

export class DeduplicationService {
  
  /**
   * Generate a dedupe key for a normalized job
   * This is used to quickly identify potential duplicates
   */
  generateDedupeKey(job: NormalizedJob): string {
    // Normalize company and title for comparison
    const company = this.normalizeCompany(job.company_name);
    const title = this.normalizeTitle(job.normalized_title || job.title);
    
    // Create fingerprint
    const fingerprint = `${company}::${title}`;
    
    // Hash for consistent key
    return crypto.createHash('sha256').update(fingerprint.toLowerCase()).digest('hex').slice(0, 32);
  }
  
  /**
   * Check if a job is a duplicate and find canonical job
   */
  async checkDuplicate(job: NormalizedJob): Promise<DeduplicationResult> {
    const supabase = getSupabaseServiceRole();
    
    // FIRST: Check for exact URL match (most reliable)
    if (job.apply_url) {
      const { data: urlMatch, error: urlError } = await supabase
        .from('jobs')
        .select('id')
        .eq('apply_url', job.apply_url)
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (!urlError && urlMatch) {
        console.log(`[Dedup] URL match found for ${job.title}`);
        return {
          is_duplicate: true,
          canonical_job_id: urlMatch.id,
          similarity_score: 1.0,
          merge_reason: 'same_url',
        };
      }
    }
    
    // SECOND: Check for exact dedupe key match
    const dedupeKey = this.generateDedupeKey(job);
    const { data: exactMatch, error } = await supabase
      .from('jobs')
      .select('id')
      .eq('dedupe_key', dedupeKey)
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (!error && exactMatch) {
      return {
        is_duplicate: true,
        canonical_job_id: exactMatch.id,
        similarity_score: 1.0,
        merge_reason: 'exact_match',
      };
    }
    
    // THIRD: Check for fuzzy matches
    const fuzzyMatch = await this.findFuzzyMatch(job);
    
    if (fuzzyMatch) {
      return fuzzyMatch;
    }
    
    return {
      is_duplicate: false,
    };
  }
  
  /**
   * Find fuzzy matches using similarity scoring
   */
  private async findFuzzyMatch(job: NormalizedJob): Promise<DeduplicationResult | null> {
    const supabase = getSupabaseServiceRole();
    
    // Get candidates with same company OR similar title from same source
    // This handles cases where company name extraction varies
    const { data: candidates, error } = await supabase
      .from('jobs')
      .select('id, normalized_title, title, company_name, description_text, posted_at, source_primary')
      .eq('status', 'active')
      .or(`company_name.ilike.${job.company_name},and(source_primary.eq.${job.source},normalized_title.ilike.%${job.normalized_title.substring(0, 30)}%)`)
      .limit(100);
    
    if (error || !candidates || candidates.length === 0) {
      return null;
    }
    
    // Score each candidate
    let bestMatch: { id: string; score: number; reason: string } | null = null;
    
    for (const candidate of candidates) {
      const score = this.calculateSimilarity(job, candidate);
      
      if (score >= 0.85 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          id: candidate.id,
          score,
          reason: this.getSimilarityReason(job, candidate, score),
        };
      }
    }
    
    if (bestMatch) {
      return {
        is_duplicate: true,
        canonical_job_id: bestMatch.id,
        similarity_score: bestMatch.score,
        merge_reason: bestMatch.reason,
      };
    }
    
    return null;
  }
  
  /**
   * Calculate similarity score between two jobs
   */
  private calculateSimilarity(job1: NormalizedJob, job2: any): number {
    let score = 0;
    let weights = 0;
    
    // Company name (weight: 0.3)
    if (this.normalizeCompany(job1.company_name) === this.normalizeCompany(job2.company_name)) {
      score += 0.3;
    }
    weights += 0.3;
    
    // Title (weight: 0.4)
    const titleSim = this.stringSimilarity(
      this.normalizeTitle(job1.normalized_title || job1.title),
      this.normalizeTitle(job2.normalized_title || job2.title)
    );
    score += titleSim * 0.4;
    weights += 0.4;
    
    // Posted date proximity (weight: 0.15)
    if (job1.posted_at && job2.posted_at) {
      const date1 = new Date(job1.posted_at).getTime();
      const date2 = new Date(job2.posted_at).getTime();
      const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
      
      // Same job typically posted within 7 days
      if (daysDiff <= 7) {
        score += 0.15 * (1 - daysDiff / 7);
      }
      weights += 0.15;
    }
    
    // Description similarity (weight: 0.15)
    if (job1.description_text && job2.description_text) {
      const descSim = this.stringSimilarity(
        job1.description_text.slice(0, 500),
        job2.description_text.slice(0, 500)
      );
      score += descSim * 0.15;
      weights += 0.15;
    }
    
    return weights > 0 ? score / weights : 0;
  }
  
  /**
   * Calculate string similarity using Jaccard index
   */
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
    const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
    
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  /**
   * Get human-readable similarity reason
   */
  private getSimilarityReason(job1: NormalizedJob, job2: any, score: number): string {
    const reasons: string[] = [];
    
    if (this.normalizeCompany(job1.company_name) === this.normalizeCompany(job2.company_name)) {
      reasons.push('same_company');
    }
    
    const titleSim = this.stringSimilarity(
      this.normalizeTitle(job1.normalized_title || job1.title),
      this.normalizeTitle(job2.normalized_title || job2.title)
    );
    
    if (titleSim >= 0.9) {
      reasons.push('identical_title');
    } else if (titleSim >= 0.7) {
      reasons.push('similar_title');
    }
    
    if (job1.posted_at && job2.posted_at) {
      const daysDiff = Math.abs(
        new Date(job1.posted_at).getTime() - new Date(job2.posted_at).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= 1) {
        reasons.push('posted_same_day');
      } else if (daysDiff <= 7) {
        reasons.push('posted_within_week');
      }
    }
    
    return reasons.join(', ') || `fuzzy_match_${Math.round(score * 100)}`;
  }
  
  /**
   * Normalize company name for comparison
   */
  private normalizeCompany(company: string): string {
    return company
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|limited|corp|corporation|gmbh|sa|srl)\b\.?/gi, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/\b(senior|sr|junior|jr|mid|level|i{1,3}|iv|v)\b\.?/gi, '')  // Remove seniority
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Merge duplicate job into canonical job
   */
  async mergeDuplicate(
    canonicalJobId: string,
    duplicateJob: NormalizedJob,
    similarityScore: number,
    mergeReason: string
  ): Promise<void> {
    const supabase = getSupabaseServiceRole();
    
    try {
      // Update canonical job's last_seen_at
      await supabase
        .from('jobs')
        .update({
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', canonicalJobId);
      
      // Store duplicate source reference in job_sources
      await supabase
        .from('job_sources')
        .insert({
          source: duplicateJob.source,
          source_job_id: duplicateJob.source_job_id,
          source_url: duplicateJob.source_url,
          raw_payload: {
            normalized_title: duplicateJob.normalized_title,
            title: duplicateJob.title,
            company_name: duplicateJob.company_name,
            posted_at: duplicateJob.posted_at,
          },
          fetched_at: new Date().toISOString(),
          job_id: canonicalJobId,
        });
      
      // Log the merge for auditability
      await supabase
        .from('job_merge_log')
        .insert({
          canonical_job_id: canonicalJobId,
          merged_from_source: duplicateJob.source,
          merged_from_source_id: duplicateJob.source_job_id,
          similarity_score: similarityScore,
          merge_reason: mergeReason,
          merged_at: new Date().toISOString(),
          created_by: 'system',
        });
      
      console.log(`[Dedup] Merged job ${duplicateJob.source_job_id} into ${canonicalJobId} (${mergeReason})`);
      
    } catch (err) {
      console.error('[Dedup] Error merging duplicate:', err);
      throw err;
    }
  }
  
  /**
   * Create new canonical job
   */
  async createCanonicalJob(job: NormalizedJob): Promise<string> {
    const supabase = getSupabaseServiceRole();
    
    const dedupeKey = this.generateDedupeKey(job);
    
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        normalized_title: job.normalized_title,
        title: job.title,
        company_name: job.company_name,
        company_domain: job.company_domain,
        description_text: job.description_text,
        requirements_text: job.requirements,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        skills_json: job.skills,
        function: job.function,
        seniority: job.seniority,
        employment_type: job.employment_type,
        remote_type: job.remote_type,
        remote_region_eligibility: job.remote_region_eligibility,
        allowed_countries: job.allowed_countries,
        locations: job.locations,
        timezone_constraints: job.timezone_constraints,
        compensation_min: job.compensation_min,
        compensation_max: job.compensation_max,
        compensation_currency: job.compensation_currency,
        language: job.language,
        apply_url: job.apply_url,
        job_url: job.job_url,
        posted_at: job.posted_at,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        dedupe_key: dedupeKey,
        status: 'active',
        source_primary: job.source,
        source_name: job.source_name,
        is_remote: job.remote_type === 'remote',
        country: job.allowed_countries[0],
        location_raw: job.locations.join(', '),
        salary_min: job.compensation_min,
        salary_max: job.compensation_max,
        salary_currency: job.compensation_currency,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[Dedup] Error creating canonical job:', error);
      throw error;
    }
    
    // Store source reference
    await supabase
      .from('job_sources')
      .insert({
        source: job.source,
        source_job_id: job.source_job_id,
        source_url: job.source_url,
        raw_payload: { title: job.title, company_name: job.company_name },
        fetched_at: new Date().toISOString(),
        job_id: data.id,
      });
    
    return data.id;
  }
}
