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
  private readonly MAX_PAGES = 3;
  private readonly PER_PAGE = 30;
  
  constructor(apiKey?: string) {
    super('getonboard', apiKey);
  }
  
  protected async fetchJobs(): Promise<RawJobPosting[]> {
    const allJobs: RawJobPosting[] = [];
    
    console.log(`[GetOnBoard] Starting job fetch...`);
    
    for (let page = 1; page <= this.MAX_PAGES; page++) {
      try {
        const url = this.buildUrl(page);
        console.log(`[GetOnBoard] Fetching page ${page}: ${url}`);
        
        const headers: HeadersInit = {
          'Accept': 'application/json',
          'User-Agent': 'JobPlatform/1.0',
        };
        
        // API key is optional, but recommended for higher rate limits
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
          console.log(`[GetOnBoard] Using API key authentication`);
        }
        
        const response = await this.fetchWithRetry(url, { headers });
        
        if (!response.ok) {
          console.error(`[GetOnBoard] HTTP ${response.status}: ${response.statusText}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log(`[GetOnBoard] Response size: ${text.length} bytes`);
        
        let data: GetOnBoardResponse;
        try {
          data = JSON.parse(text) as GetOnBoardResponse;
        } catch (parseError) {
          console.error(`[GetOnBoard] JSON parse error:`, parseError);
          console.error(`[GetOnBoard] Response preview:`, text.substring(0, 200));
          throw new Error('Invalid JSON response from GetOnBoard API');
        }
        
        if (!data.data || !Array.isArray(data.data)) {
          console.warn(`[GetOnBoard] No data array in response`);
          break;
        }
        
        if (data.data.length === 0) {
          console.log(`[GetOnBoard] No more jobs on page ${page}`);
          break;
        }
        
        // Filter for remote jobs (double-check)
        const remoteJobs = data.data.filter(job => job.attributes.remote === true);
        console.log(`[GetOnBoard] Found ${data.data.length} jobs, ${remoteJobs.length} remote`);
        
        const jobs = remoteJobs.map(job => ({
          source: 'getonboard' as const,
          source_job_id: String(job.id),
          source_url: job.links['public-url'],
          raw_data: job as unknown as Record<string, unknown>,
          fetched_at: new Date().toISOString(),
        }));
        
        allJobs.push(...jobs);
        
        console.log(`[GetOnBoard] Added ${jobs.length} jobs from page ${page} (total: ${allJobs.length})`);
        
        // Check if we've reached the end
        if (data.meta && page >= data.meta['total-pages']) {
          console.log(`[GetOnBoard] Reached last page (${data.meta['total-pages']})`);
          break;
        }
        
        // Rate limiting - be gentle with the API
        if (page < this.MAX_PAGES) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err) {
        console.error(`[GetOnBoard] Error fetching page ${page}:`, err);
        // If first page fails, throw error; otherwise just stop
        if (page === 1) {
          throw err;
        }
        break;
      }
    }
    
    console.log(`[GetOnBoard] Completed: ${allJobs.length} total jobs fetched`);
    return allJobs;
  }
  
  private buildUrl(page: number): string {
    const url = new URL(this.API_URL);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(this.PER_PAGE));
    
    // Filter for remote jobs - use expand param to get full data
    url.searchParams.set('expand', 'company');
    url.searchParams.set('remote', 'true');
    
    // Sort by newest first
    url.searchParams.set('sort', '-published_at');
    
    return url.toString();
  }
}
