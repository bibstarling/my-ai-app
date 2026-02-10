/**
 * Adzuna API Worker
 * Fetches remote jobs from Adzuna API
 * API Docs: https://developer.adzuna.com/
 */

import { BaseJobWorker } from './base-worker';
import { RawJobPosting } from '@/lib/types/job-intelligence';

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  created: string;
  redirect_url: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area?: string[];
  };
  category: {
    label: string;
    tag: string;
  };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  contract_time?: string;
  contract_type?: string;
  [key: string]: unknown;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

export class AdzunaWorker extends BaseJobWorker {
  private readonly BASE_URL = 'https://api.adzuna.com/v1/api/jobs';
  private readonly DEFAULT_COUNTRY = 'us';  // Can be configured per region
  private readonly MAX_RESULTS_PER_PAGE = 50;
  private readonly MAX_PAGES = 4;  // Fetch up to 200 jobs
  
  constructor(apiKey?: string, appId?: string) {
    super('adzuna', apiKey);
    this.appId = appId;
  }
  
  private appId?: string;
  
  protected async fetchJobs(): Promise<RawJobPosting[]> {
    if (!this.apiKey || !this.appId) {
      console.warn('[adzuna] API credentials not configured, skipping');
      return [];
    }
    
    const allJobs: RawJobPosting[] = [];
    
    // Fetch multiple pages
    for (let page = 1; page <= this.MAX_PAGES; page++) {
      try {
        const url = this.buildUrl(page);
        const response = await this.fetchWithRetry(url);
        const data = await response.json() as AdzunaResponse;
        
        if (!data.results || data.results.length === 0) {
          break;  // No more results
        }
        
        const jobs = data.results.map(job => ({
          source: 'adzuna' as const,
          source_job_id: String(job.id),
          source_url: job.redirect_url,
          raw_data: job,
          fetched_at: new Date().toISOString(),
        }));
        
        allJobs.push(...jobs);
        
        console.log(`[adzuna] Fetched page ${page}: ${jobs.length} jobs`);
        
        // Rate limiting: wait between pages
        if (page < this.MAX_PAGES) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`[adzuna] Error fetching page ${page}:`, err);
        break;
      }
    }
    
    return allJobs;
  }
  
  private buildUrl(page: number): string {
    const url = new URL(`${this.BASE_URL}/${this.DEFAULT_COUNTRY}/search/${page}`);
    
    // Required auth params
    url.searchParams.set('app_id', this.appId!);
    url.searchParams.set('app_key', this.apiKey!);
    
    // Search params for remote jobs
    url.searchParams.set('what', 'remote');  // Keyword search
    url.searchParams.set('results_per_page', String(this.MAX_RESULTS_PER_PAGE));
    url.searchParams.set('content-type', 'application/json');
    
    // Optional: filter by date
    const daysAgo = 30;
    url.searchParams.set('max_days_old', String(daysAgo));
    
    return url.toString();
  }
}
