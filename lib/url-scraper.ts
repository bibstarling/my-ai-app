import * as cheerio from 'cheerio';
import { generateAICompletion } from './ai-provider';

const LIGHT_FETCH_CONTENT_LIMIT = 35000;
const LIGHT_FETCH_MIN_CONTENT = 800;

/** Job/main content selectors to try (in order). */
const JOB_CONTENT_SELECTORS = [
  '[data-job-description]', '.job-description', '.job-description__content', '.job-details',
  '.job-content', '.position-description', '#job-description', '.job-view__body',
  '.job-view__description', '.description__text', '.job-detail-description',
  '.job-body', '[class*="job-description"]', '[class*="JobDescription"]',
  'article', 'main', '[role="main"]', '.content', '.post-content', '#content', '.article-body', '.description',
];

interface ScrapedData {
  title: string;
  description: string;
  content: string;
  metadata: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    favicon?: string;
    author?: string;
    publishDate?: string;
    [key: string]: any;
  };
}

/**
 * Get Puppeteer browser instance (serverless-compatible)
 */
async function getBrowser() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`[getBrowser] Environment: ${isProduction ? 'production' : 'development'}`);
  
  if (isProduction) {
    // Use chromium for serverless (Vercel)
    try {
      console.log('[getBrowser] Loading serverless chromium...');
      const chromium = await import('@sparticuz/chromium');
      const puppeteerCore = await import('puppeteer-core');
      
      // Get executable path
      const executablePath = await chromium.default.executablePath();
      
      console.log(`[getBrowser] Chromium executable: ${executablePath}`);
      
      // Get args
      const args = chromium.default.args;
      
      return puppeteerCore.default.launch({
        args: [
          ...args,
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials',
        ],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
      });
    } catch (error) {
      console.error('[getBrowser] Failed to launch serverless chromium:', error);
      console.error('[getBrowser] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack',
      });
      throw new Error(`Failed to initialize browser in production: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Use regular puppeteer for local development
    console.log('[getBrowser] Loading local puppeteer...');
    const puppeteer = await import('puppeteer');
    
    return puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security'
      ],
    });
  }
}

/**
 * Fallback scraping using simple HTTP fetch (no browser)
 */
async function simpleScrapeUrl(url: string): Promise<ScrapedData> {
  console.log(`[simpleScrapeUrl] Using fallback HTTP scraping for: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  
  // Extract Open Graph data
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  
  // Extract text content (remove HTML tags)
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit content length
  if (content.length > 10000) {
    content = content.substring(0, 10000) + '...';
  }
  
  console.log(`[simpleScrapeUrl] Extracted ${content.length} characters`);
  
  return {
    title: title || (ogTitleMatch ? ogTitleMatch[1] : 'Untitled'),
    description: description || (ogDescMatch ? ogDescMatch[1] : ''),
    content,
    metadata: {
      ogTitle: ogTitleMatch ? ogTitleMatch[1] : undefined,
      ogDescription: ogDescMatch ? ogDescMatch[1] : undefined,
      ogImage: ogImageMatch ? ogImageMatch[1] : undefined,
    },
  };
}

/**
 * Lightweight fetch for job URLs: HTTP only, no Puppeteer. Uses cheerio to extract main/job content.
 * Returns quickly for static pages. Use first; fall back to scrapeUrl if content too short or fetch fails.
 */
export async function fetchPageContentLight(url: string): Promise<{ title: string; content: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').first().text().trim() || ($('meta[property="og:title"]').attr('content') ?? '');
    let content = '';
    for (const sel of JOB_CONTENT_SELECTORS) {
      const el = $(sel).first();
      if (el.length) {
        const text = el.text().replace(/\s+/g, ' ').trim();
        if (text.length >= LIGHT_FETCH_MIN_CONTENT) {
          content = text.length > LIGHT_FETCH_CONTENT_LIMIT ? text.slice(0, LIGHT_FETCH_CONTENT_LIMIT) + '...' : text;
          break;
        }
      }
    }
    if (!content) {
      content = $('body').text().replace(/\s+/g, ' ').trim();
      if (content.length > LIGHT_FETCH_CONTENT_LIMIT) content = content.slice(0, LIGHT_FETCH_CONTENT_LIMIT) + '...';
    }
    return { title, content };
  } finally {
    clearTimeout(timeout);
  }
}

export type ScrapeUrlOptions = { mode?: 'default' | 'job' };

/**
 * Scrape a URL and extract content
 */
export async function scrapeUrl(url: string, options: ScrapeUrlOptions = {}): Promise<ScrapedData> {
  let browser: any = null;
  const startTime = Date.now();
  
  try {
    console.log(`[scrapeUrl] Starting scrape for: ${url}`);
    
    // Try browser-based scraping first
    try {
      // Launch browser (production or dev)
      browser = await getBrowser();
      console.log(`[scrapeUrl] Browser launched in ${Date.now() - startTime}ms`);

      const page = await browser.newPage();
      
      // Set user agent to avoid being blocked
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      console.log(`[scrapeUrl] Navigating to ${url}... (mode: ${options.mode ?? 'default'})`);
      const isJobMode = options.mode === 'job';
      const waitStrategy = isJobMode ? 'domcontentloaded' : 'networkidle2';
      const navTimeout = isJobMode ? 15000 : 30000;
      const extraWait = isJobMode ? 2000 : 0;

      try {
        await page.goto(url, { waitUntil: waitStrategy, timeout: navTimeout });
        console.log(`[scrapeUrl] Page loaded (${waitStrategy}) in ${Date.now() - startTime}ms`);
        if (extraWait > 0) {
          await new Promise(resolve => setTimeout(resolve, extraWait));
          console.log(`[scrapeUrl] Waited ${extraWait}ms for dynamic content`);
        }
      } catch (navError: any) {
        if (!isJobMode && (navError?.message?.includes('timeout') || navError?.message?.includes('Navigation timeout'))) {
          console.log('[scrapeUrl] networkidle2 timed out, trying domcontentloaded...');
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw navError;
        }
      }

      // Extract data from page (job mode uses more selectors and higher limit)
      const contentLimit = isJobMode ? 28000 : 10000;
      const contentSelectors = isJobMode
        ? ['[data-job-description]', '.job-description', '.job-description__content', '.job-details', '.job-content', '.position-description', '#job-description', '.job-view__body', '.description__text', 'article', 'main', '[role="main"]', '.content', '.post-content', '#content']
        : ['article', 'main', '[role="main"]', '.content', '.post-content', '.article-content', '#content'];

      const scrapedData: ScrapedData = await (page as any).evaluate((selectors: string[], maxLen: number) => {
        const title = document.querySelector('title')?.textContent || document.querySelector('h1')?.textContent || '';
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
        const favicon = document.querySelector('link[rel="icon"]')?.getAttribute('href') || document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href');
        const author = document.querySelector('meta[name="author"]')?.getAttribute('content');
        const publishDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || document.querySelector('time')?.getAttribute('datetime');

        let content = '';
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el && (el.textContent || '').trim().length > 200) {
            content = (el.textContent || '').replace(/\s+/g, ' ').trim();
            break;
          }
        }
        if (!content) content = (document.body?.textContent || '').replace(/\s+/g, ' ').trim();
        if (content.length > maxLen) content = content.substring(0, maxLen) + '...';

        return {
          title: title.trim(),
          description: description.trim(),
          content,
          metadata: { ogTitle: ogTitle || undefined, ogDescription: ogDescription || undefined, ogImage: ogImage || undefined, favicon: favicon || undefined, author: author || undefined, publishDate: publishDate || undefined },
        };
      }, contentSelectors, contentLimit);

      await browser.close();
      
      console.log(`[scrapeUrl] ✅ Browser scraping completed in ${Date.now() - startTime}ms`);
      console.log(`[scrapeUrl] Extracted ${scrapedData.content.length} characters of content`);

      return scrapedData;
    } catch (browserError) {
      console.warn(`[scrapeUrl] ⚠️ Browser scraping failed, trying fallback...`, browserError);
      
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('[scrapeUrl] Failed to close browser:', closeError);
        }
      }
      
      // Fallback to simple HTTP scraping
      const fallbackData = await simpleScrapeUrl(url);
      console.log(`[scrapeUrl] ✅ Fallback scraping completed in ${Date.now() - startTime}ms`);
      return fallbackData;
    }
  } catch (error) {
    console.error(`[scrapeUrl] ❌ Error after ${Date.now() - startTime}ms:`, error);
    
    if (browser) {
      try {
        await browser.close();
        console.log('[scrapeUrl] Browser closed after error');
      } catch (closeError) {
        console.error('[scrapeUrl] Failed to close browser:', closeError);
      }
    }
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error(`Timeout while scraping ${url}. The website took too long to load.`);
      } else if (error.message.includes('net::ERR_')) {
        throw new Error(`Network error while accessing ${url}. The website may be down or blocking requests.`);
      } else if (error.message.includes('executable')) {
        throw new Error('Browser initialization failed. This may be a configuration issue in production.');
      }
    }
    
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze scraped content with AI to extract relevant portfolio information
 */
export async function analyzeScrapedContent(
  url: string,
  scrapedData: ScrapedData,
  userId: string
): Promise<any> {
  try {
    const response = await generateAICompletion(
      userId,
      'url_analysis',
      'You are analyzing web content for a professional portfolio.',
      [
        {
          role: 'user',
          content: `I'm building a professional portfolio. Please analyze this scraped web page and extract relevant information:

URL: ${url}
Title: ${scrapedData.title}
Description: ${scrapedData.description}

Content:
${scrapedData.content.substring(0, 5000)}

Please respond in JSON format:
{
  "relevance": "high|medium|low - how relevant is this for a portfolio",
  "contentType": "article|project|profile|documentation|other",
  "extractedInfo": {
    "keyPoints": ["point1", "point2"],
    "technologies": ["tech1", "tech2"],
    "achievements": ["achievement1"],
    "topics": ["topic1", "topic2"]
  },
  "suggestedUse": "how this could be used in the portfolio",
  "summary": "brief summary of the content"
}`
        }
      ],
      2048
    );

    const responseText = response.content;

    // Try to parse JSON response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = { rawResponse: responseText };
      }
    } catch {
      analysis = { rawResponse: responseText };
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing scraped content:', error);
    return {
      error: 'Failed to analyze content',
      relevance: 'unknown',
    };
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
