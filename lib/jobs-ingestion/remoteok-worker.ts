/**
 * RemoteOK API Worker
 * Fetches remote jobs from RemoteOK API
 * API Docs: https://remoteok.com/api
 */

import { BaseJobWorker } from './base-worker';
import { RawJobPosting } from '@/lib/types/job-intelligence';

interface RemoteOKJob {
  id: string;
  slug: string;
  position: string;
  company: string;
  company_logo?: string;
  location?: string;
  tags?: string[];
  description?: string;
  date: string;
  url: string;
  apply_url?: string;
  salary_min?: number;
  salary_max?: number;
  [key: string]: unknown;
}

export class RemoteOKWorker extends BaseJobWorker {
  private readonly API_URL = 'https://remoteok.com/api';
  
  constructor() {
    super('remoteok');
  }
  
  protected async fetchJobs(): Promise<RawJobPosting[]> {
    const response = await this.fetchWithRetry(this.API_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json() as RemoteOKJob[];
    
    // First item is API info, skip it
    const jobs = data.slice(1);
    
    return jobs.map(job => ({
      source: 'remoteok' as const,
      source_job_id: job.id || job.slug,
      source_url: job.url,
      raw_data: job,
      fetched_at: new Date().toISOString(),
    }));
  }
}
