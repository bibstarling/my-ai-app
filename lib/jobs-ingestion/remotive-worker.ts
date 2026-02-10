/**
 * Remotive API Worker
 * Fetches remote jobs from Remotive API
 * API Docs: https://remotive.com/api-documentation
 */

import { BaseJobWorker } from './base-worker';
import { RawJobPosting } from '@/lib/types/job-intelligence';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  tags?: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location?: string;
  salary?: string;
  description: string;
  [key: string]: unknown;
}

interface RemotiveResponse {
  '0-legal-notice': string;
  jobs: RemotiveJob[];
}

export class RemotiveWorker extends BaseJobWorker {
  private readonly API_URL = 'https://remotive.com/api/remote-jobs';
  
  constructor() {
    super('remotive');
  }
  
  protected async fetchJobs(): Promise<RawJobPosting[]> {
    const response = await this.fetchWithRetry(this.API_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json() as RemotiveResponse;
    const jobs = data.jobs || [];
    
    return jobs.map(job => ({
      source: 'remotive' as const,
      source_job_id: String(job.id),
      source_url: job.url,
      raw_data: job,
      fetched_at: new Date().toISOString(),
    }));
  }
}
