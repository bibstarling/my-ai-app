/**
 * Base class for job ingestion workers
 * Provides common functionality for all sources
 */

import { JobSourceEnum, RawJobPosting } from '@/lib/types/job-intelligence';

export interface IngestionResult {
  success: boolean;
  jobs_fetched: number;
  jobs_processed: number;
  errors: string[];
  duration_ms: number;
  raw_jobs?: RawJobPosting[]; // Include raw jobs for pipeline processing
}

export abstract class BaseJobWorker {
  protected source: JobSourceEnum;
  protected apiKey?: string;
  
  constructor(source: JobSourceEnum, apiKey?: string) {
    this.source = source;
    this.apiKey = apiKey;
  }
  
  /**
   * Main entry point: fetch and process jobs from the source
   */
  async ingest(): Promise<IngestionResult> {
    const startTime = Date.now();
    const result: IngestionResult = {
      success: false,
      jobs_fetched: 0,
      jobs_processed: 0,
      errors: [],
      duration_ms: 0,
      raw_jobs: [],
    };
    
    try {
      console.log(`[${this.source}] Starting ingestion...`);
      
      // Fetch raw jobs from API
      const rawJobs = await this.fetchJobs();
      result.jobs_fetched = rawJobs.length;
      result.raw_jobs = rawJobs; // Store raw jobs for pipeline processing
      
      console.log(`[${this.source}] Fetched ${rawJobs.length} jobs`);
      
      // Process each job (store in job_sources table for audit trail)
      for (const rawJob of rawJobs) {
        try {
          await this.processJob(rawJob);
          result.jobs_processed++;
        } catch (err) {
          const error = err as Error;
          console.error(`[${this.source}] Error processing job ${rawJob.source_job_id}:`, error);
          result.errors.push(`Job ${rawJob.source_job_id}: ${error.message}`);
        }
      }
      
      result.success = result.errors.length < rawJobs.length * 0.5; // Success if <50% errors
      console.log(`[${this.source}] Ingestion complete: ${result.jobs_processed}/${result.jobs_fetched} processed`);
      
    } catch (err) {
      const error = err as Error;
      console.error(`[${this.source}] Fatal ingestion error:`, error);
      result.errors.push(`Fatal: ${error.message}`);
    } finally {
      result.duration_ms = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * Fetch raw job data from the source API
   * Must be implemented by each source
   */
  protected abstract fetchJobs(): Promise<RawJobPosting[]>;
  
  /**
   * Process a single raw job posting
   * Override if custom processing is needed
   */
  protected async processJob(rawJob: RawJobPosting): Promise<void> {
    // Default implementation: just log
    // Actual processing (normalization, deduplication) happens in separate services
    console.log(`[${this.source}] Processing job: ${rawJob.source_job_id}`);
  }
  
  /**
   * Make an HTTP request with error handling
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'JobIntelligencePlatform/1.0',
            ...options.headers,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (err) {
        lastError = err as Error;
        console.warn(`[${this.source}] Fetch attempt ${i + 1} failed:`, lastError.message);
        
        if (i < retries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError || new Error('Fetch failed after retries');
  }
  
  /**
   * Clean and normalize text fields
   */
  protected cleanText(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
      .trim();
  }
  
  /**
   * Extract domain from URL or email
   */
  protected extractDomain(urlOrEmail: string): string | undefined {
    try {
      if (urlOrEmail.includes('@')) {
        return urlOrEmail.split('@')[1].toLowerCase();
      }
      const url = new URL(urlOrEmail.startsWith('http') ? urlOrEmail : `https://${urlOrEmail}`);
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return undefined;
    }
  }
  
  /**
   * Parse salary string to numeric range
   */
  protected parseSalary(salaryText: string): { min?: number; max?: number; currency?: string } {
    if (!salaryText) return {};
    
    const result: { min?: number; max?: number; currency?: string } = {};
    
    // Extract currency
    const currencyMatch = salaryText.match(/\b(USD|EUR|GBP|BRL|CAD|AUD|MXN|\$|€|£)\b/i);
    if (currencyMatch) {
      const symbol = currencyMatch[1];
      result.currency = symbol === '$' ? 'USD' : symbol === '€' ? 'EUR' : symbol === '£' ? 'GBP' : symbol;
    }
    
    // Extract numbers (supports formats like "100k", "100,000", "100K-150K")
    const numbers = salaryText.match(/\d+[,.]?\d*[kK]?/g) || [];
    const parsed = numbers.map(n => {
      let val = parseFloat(n.replace(/,/g, ''));
      if (/[kK]/.test(n)) val *= 1000;
      return val;
    });
    
    if (parsed.length === 1) {
      result.min = parsed[0];
      result.max = parsed[0];
    } else if (parsed.length >= 2) {
      result.min = Math.min(...parsed);
      result.max = Math.max(...parsed);
    }
    
    return result;
  }
}
