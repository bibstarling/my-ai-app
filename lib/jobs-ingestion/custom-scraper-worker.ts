/**
 * Custom Scraper Worker
 * Generic web scraper for user-defined job board sources
 * Supports RSS feeds, HTML lists, and JSON APIs
 */

import { BaseJobWorker, IngestionResult } from './base-worker';
import { RawJobPosting, JobSourceEnum } from '@/lib/types/job-intelligence';
import * as cheerio from 'cheerio';

export interface CustomSourceConfig {
  id: string;
  name: string;
  url: string;
  source_type: 'rss' | 'html' | 'html_list' | 'json' | 'json_api' | 'custom';
  config: {
    // HTML List selectors
    jobSelector?: string;
    titleSelector?: string;
    companySelector?: string;
    locationSelector?: string;
    descriptionSelector?: string;
    urlSelector?: string;
    dateSelector?: string;
    
    // RSS feed mappings
    rssItemTag?: string;
    rssTitleTag?: string;
    rssDescriptionTag?: string;
    rssLinkTag?: string;
    rssDateTag?: string;
    
    // JSON API paths
    jsonJobsPath?: string;
    jsonTitlePath?: string;
    jsonCompanyPath?: string;
    jsonDescriptionPath?: string;
    jsonUrlPath?: string;
    jsonDatePath?: string;
    
    // Pagination
    paginationSelector?: string;
    maxPages?: number;
  };
}

export class CustomScraperWorker extends BaseJobWorker {
  private customSource: CustomSourceConfig;
  private sourceName: string;
  
  constructor(customSource: CustomSourceConfig) {
    // Use the actual source_key instead of 'custom'
    super(customSource.id as JobSourceEnum);
    this.customSource = customSource;
    this.sourceName = customSource.name;
  }
  
  protected async fetchJobs(): Promise<RawJobPosting[]> {
    console.log(`[CustomScraper:${this.customSource.name}] Starting scrape...`);
    
    try {
      switch (this.customSource.source_type) {
        case 'rss':
          return await this.scrapeRSS();
        case 'html':
        case 'html_list':
          return await this.scrapeHTMLList();
        case 'json':
        case 'json_api':
          return await this.scrapeJSONAPI();
        default:
          throw new Error(`Unsupported source type: ${this.customSource.source_type}`);
      }
    } catch (error) {
      console.error(`[CustomScraper:${this.customSource.name}] Scrape failed:`, error);
      throw error; // Re-throw to update sync status
    }
  }
  
  /**
   * Scrape RSS feed
   */
  private async scrapeRSS(): Promise<RawJobPosting[]> {
    const jobs: RawJobPosting[] = [];
    
    try {
      console.log(`[CustomScraper:${this.customSource.name}] Fetching RSS from ${this.customSource.url}`);
      const response = await fetch(this.customSource.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        },
      });
      
      if (!response.ok) {
        console.error(`[CustomScraper:${this.customSource.name}] HTTP error: ${response.status}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xml = await response.text();
      console.log(`[CustomScraper:${this.customSource.name}] Fetched ${xml.length} bytes of XML`);
      
      if (xml.length < 100) {
        console.error(`[CustomScraper:${this.customSource.name}] Response too short, likely not valid RSS`);
        throw new Error('Invalid RSS feed - response too short');
      }
      
      const $ = cheerio.load(xml, { xmlMode: true });
      
      const config = this.customSource.config;
      const itemTag = config.rssItemTag || 'item';
      
      const items = $(itemTag);
      console.log(`[CustomScraper:${this.customSource.name}] Found ${items.length} <${itemTag}> items`);
      
      if (items.length === 0) {
        console.warn(`[CustomScraper:${this.customSource.name}] No items found with selector '${itemTag}'`);
        return jobs; // Return empty array, not an error
      }
      
      items.each((_, element) => {
        const $item = $(element);
        
        const title = $item.find(config.rssTitleTag || 'title').text().trim();
        const description = $item.find(config.rssDescriptionTag || 'description').text().trim();
        const link = $item.find(config.rssLinkTag || 'link').text().trim();
        const dateStr = $item.find(config.rssDateTag || 'pubDate').text().trim();
        
        if (!title || !link) return;
        
        // Try to extract company name from title (common formats: "Title at Company", "Title - Company", "Company: Title")
        const company = this.extractCompanyFromTitle(title);
        
        jobs.push({
          source: this.source,
          source_job_id: this.generateSourceId(link),
          source_url: link,
          raw_data: {
            title,
            description,
            url: link,
            date: dateStr,
            source_name: this.sourceName,
            company: company || undefined, // Only set if extracted, otherwise undefined
          },
          fetched_at: new Date().toISOString(),
        });
      });
      
      console.log(`[CustomScraper:${this.customSource.name}] Successfully parsed ${jobs.length} jobs from RSS`);
      
    } catch (error) {
      console.error(`[CustomScraper:${this.customSource.name}] RSS scrape failed:`, error);
      throw error;
    }
    
    return jobs;
  }
  
  /**
   * Scrape HTML list
   */
  private async scrapeHTMLList(): Promise<RawJobPosting[]> {
    const jobs: RawJobPosting[] = [];
    
    try {
      const response = await fetch(this.customSource.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const config = this.customSource.config;
      const jobSelector = config.jobSelector || '.job-listing';
      
      $(jobSelector).each((_, element) => {
        const $job = $(element);
        
        const title = this.extractText($job, config.titleSelector || 'h2, .title');
        const company = this.extractText($job, config.companySelector || '.company');
        const location = this.extractText($job, config.locationSelector || '.location');
        const description = this.extractText($job, config.descriptionSelector || '.description, p');
        const url = this.extractUrl($job, config.urlSelector || 'a');
        const dateStr = this.extractText($job, config.dateSelector || '.date, time');
        
        if (!title || !url) return;
        
        const resolvedUrl = this.resolveUrl(url);
        jobs.push({
          source: this.source,
          source_job_id: this.generateSourceId(resolvedUrl),
          source_url: resolvedUrl,
          raw_data: {
            title,
            company: company || this.sourceName,
            location,
            description,
            url: resolvedUrl,
            date: dateStr,
            source_name: this.sourceName,
            remote_type: this.detectRemoteType(title, description, location),
          },
          fetched_at: new Date().toISOString(),
        });
      });
      
    } catch (error) {
      console.error(`[CustomScraper:${this.customSource.name}] HTML scrape failed:`, error);
      throw error;
    }
    
    return jobs;
  }
  
  /**
   * Scrape JSON API
   */
  private async scrapeJSONAPI(): Promise<RawJobPosting[]> {
    const jobs: RawJobPosting[] = [];
    
    try {
      const response = await fetch(this.customSource.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const config = this.customSource.config;
      
      // Get jobs array from JSON path
      const jobsArray = this.getJSONPath(data, config.jsonJobsPath || 'jobs');
      
      if (!Array.isArray(jobsArray)) {
        throw new Error('Jobs data is not an array');
      }
      
      for (const item of jobsArray) {
        const title = this.getJSONPath(item, config.jsonTitlePath || 'title');
        const company = this.getJSONPath(item, config.jsonCompanyPath || 'company');
        const description = this.getJSONPath(item, config.jsonDescriptionPath || 'description');
        const url = this.getJSONPath(item, config.jsonUrlPath || 'url');
        const dateStr = this.getJSONPath(item, config.jsonDatePath || 'date');
        
        if (!title || !url) continue;
        
        jobs.push({
          source: this.source,
          source_job_id: this.generateSourceId(url),
          source_url: url,
          raw_data: {
            ...item,
            title,
            company: company || this.sourceName,
            description,
            url,
            date: dateStr,
            source_name: this.sourceName,
          },
          fetched_at: new Date().toISOString(),
        });
      }
      
    } catch (error) {
      console.error(`[CustomScraper:${this.customSource.name}] JSON scrape failed:`, error);
      throw error;
    }
    
    return jobs;
  }
  
  // ===== Helper Methods =====
  
  private extractText($element: cheerio.Cheerio, selector: string): string {
    return $element.find(selector).first().text().trim();
  }
  
  private extractUrl($element: cheerio.Cheerio, selector: string): string {
    return $element.find(selector).first().attr('href') || '';
  }
  
  private resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    
    const baseUrl = new URL(this.customSource.url);
    if (url.startsWith('/')) {
      return `${baseUrl.origin}${url}`;
    }
    return `${baseUrl.origin}/${url}`;
  }
  
  private generateSourceId(url: string): string {
    // Use URL hash as source ID
    return Buffer.from(url).toString('base64').substring(0, 32);
  }
  
  private cleanHTML(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }
  
  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  }
  
  private detectRemoteType(title: string, description: string, location: string | null): string | null {
    const text = `${title} ${description} ${location ?? ''}`.toLowerCase();
    // Check onsite/in-person first so we don't label them as remote
    if (
      /in[-\s]?person|on[-\s]?site|onsite|in[-\s]?office|office[-\s]?based|work (in|at) (our )?office|no remote|not remote/.test(
        text
      )
    ) {
      return 'Onsite';
    }
    if (text.includes('hybrid')) return 'Hybrid';
    if (text.includes('remote') || text.includes('work from home') || text.includes('wfh')) {
      return 'Remote';
    }
    return null;
  }
  
  private getJSONPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) return null;
      current = current[key];
    }
    
    return current;
  }
  
  private extractCompanyFromTitle(title: string): string | null {
    // Try common patterns to extract company name from title
    
    // Pattern 1: "Job Title at Company Name"
    let match = title.match(/\s+at\s+(.+?)(?:\s*[-|•]\s*|$)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Pattern 2: "Job Title - Company Name"
    match = title.match(/\s+-\s+(.+?)(?:\s*[-|•]\s*|$)/);
    if (match && match[1] && !match[1].match(/^(remote|hybrid|full.?time|part.?time)/i)) {
      return match[1].trim();
    }
    
    // Pattern 3: "Company Name: Job Title"
    match = title.match(/^(.+?):\s+/);
    if (match && match[1] && match[1].length < 50) { // Company name shouldn't be too long
      return match[1].trim();
    }
    
    // Pattern 4: "Job Title | Company Name"
    match = title.match(/\s+\|\s+(.+?)$/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return null;
  }
}
