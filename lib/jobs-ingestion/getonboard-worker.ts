/**
 * Get on Board API Worker
 * Fetches LATAM tech jobs from Get on Board API
 * API Docs: https://www.getonbrd.com/api/v0/
 */

import { BaseJobWorker } from './base-worker';
import { RawJobPosting } from '@/lib/types/job-intelligence';

interface GetOnBoardJob {
  id: number;
  attributes: {
    title: string;
    description: string;
    'published-at': string;
    'remote-zone'?: string;
    remote: boolean;
    'remote-modality'?: string;
    functions: {
      data: Array<{
        id: number;
        attributes: {
          name: string;
        };
      }>;
    };
    seniority: {
      data?: {
        id: number;
        attributes: {
          name: string;
        };
      };
    };
    company: {
      data: {
        id: number;
        attributes: {
          name: string;
          description?: string;
          logo?: string;
        };
      };
    };
    'min-salary'?: number;
    'max-salary'?: number;
    currency?: string;
    category?: {
      data?: {
        attributes: {
          name: string;
        };
      };
    };
  };
  links: {
    'public-url': string;
  };
}

interface GetOnBoardResponse {
  data: GetOnBoardJob[];
  meta?: {
    total: number;
    'total-pages': number;
  };
}

export class GetOnBoardWorker extends BaseJobWorker {
  private readonly API_URL = 'https://www.getonbrd.com/api/v0/jobs';
  private readonly MAX_PAGES = 5;
  private readonly PER_PAGE = 100;
  
  constructor(apiKey?: string) {
    super('getonboard', apiKey);
  }
  
  protected async fetchJobs(): Promise<RawJobPosting[]> {
    const allJobs: RawJobPosting[] = [];
    
    for (let page = 1; page <= this.MAX_PAGES; page++) {
      try {
        const url = this.buildUrl(page);
        const headers: HeadersInit = {
          'Accept': 'application/json',
        };
        
        // API key is optional, but recommended for higher rate limits
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        
        const response = await this.fetchWithRetry(url, { headers });
        const data = await response.json() as GetOnBoardResponse;
        
        if (!data.data || data.data.length === 0) {
          break;
        }
        
        const jobs = data.data.map(job => ({
          source: 'getonboard' as const,
          source_job_id: String(job.id),
          source_url: job.links['public-url'],
          raw_data: job as unknown as Record<string, unknown>,
          fetched_at: new Date().toISOString(),
        }));
        
        allJobs.push(...jobs);
        
        console.log(`[getonboard] Fetched page ${page}: ${jobs.length} jobs`);
        
        // Check if we've reached the end
        if (data.meta && page >= data.meta['total-pages']) {
          break;
        }
        
        // Rate limiting
        if (page < this.MAX_PAGES) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`[getonboard] Error fetching page ${page}:`, err);
        break;
      }
    }
    
    return allJobs;
  }
  
  private buildUrl(page: number): string {
    const url = new URL(this.API_URL);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(this.PER_PAGE));
    
    // Filter for remote jobs
    url.searchParams.set('remote', 'true');
    
    // Optional: filter by recent jobs
    const daysAgo = 30;
    const since = new Date();
    since.setDate(since.getDate() - daysAgo);
    url.searchParams.set('published_at[gte]', since.toISOString().split('T')[0]);
    
    return url.toString();
  }
}
