import { generateAICompletion } from './ai-provider';

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
      
      const executablePath = await chromium.default.executablePath();
      console.log(`[getBrowser] Chromium executable: ${executablePath}`);
      
      return puppeteerCore.default.launch({
        args: [...chromium.default.args, '--disable-web-security'],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
      });
    } catch (error) {
      console.error('[getBrowser] Failed to launch serverless chromium:', error);
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
 * Scrape a URL and extract content
 */
export async function scrapeUrl(url: string): Promise<ScrapedData> {
  let browser = null;
  const startTime = Date.now();
  
  try {
    console.log(`[scrapeUrl] Starting scrape for: ${url}`);
    
    // Launch browser (production or dev)
    browser = await getBrowser();
    console.log(`[scrapeUrl] Browser launched in ${Date.now() - startTime}ms`);

    const page = await browser.newPage();
    
    // Set user agent to avoid being blocked
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`[scrapeUrl] Navigating to ${url}...`);
    
    // Navigate to URL with timeout - use domcontentloaded as fallback for slow sites
    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      console.log(`[scrapeUrl] Page loaded (networkidle2) in ${Date.now() - startTime}ms`);
    } catch (navError: any) {
      // If networkidle2 times out, try with just domcontentloaded
      if (navError?.message?.includes('timeout') || navError?.message?.includes('Navigation timeout')) {
        console.log('[scrapeUrl] networkidle2 timed out, trying with domcontentloaded...');
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });
        // Give it a bit more time to load dynamic content using Promise-based delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`[scrapeUrl] Page loaded (domcontentloaded + wait) in ${Date.now() - startTime}ms`);
      } else {
        throw navError;
      }
    }

    // Extract data from page
    // Use type assertion to fix puppeteer/puppeteer-core type conflict
    const scrapedData: ScrapedData = await (page as any).evaluate(() => {
      // This function runs in the browser context
      // Extract title
      const title = document.querySelector('title')?.textContent || 
                   document.querySelector('h1')?.textContent || 
                   '';

      // Extract meta description
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      // Extract Open Graph data
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');

      // Extract favicon
      const favicon = document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                     document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href');

      // Extract author
      const author = document.querySelector('meta[name="author"]')?.getAttribute('content');

      // Extract publish date
      const publishDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                         document.querySelector('time')?.getAttribute('datetime');

      // Extract main content (try different selectors)
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.post-content',
        '.article-content',
        '#content',
      ];

      let content = '';
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.textContent || '';
          break;
        }
      }

      // Fallback to body if no content found
      if (!content) {
        content = document.body?.textContent || '';
      }

      // Clean up content (remove excessive whitespace)
      content = content.replace(/\s+/g, ' ').trim();
      
      // Limit content length
      if (content.length > 10000) {
        content = content.substring(0, 10000) + '...';
      }

      return {
        title: title.trim(),
        description: description.trim(),
        content,
        metadata: {
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          ogImage: ogImage || undefined,
          favicon: favicon || undefined,
          author: author || undefined,
          publishDate: publishDate || undefined,
        },
      };
    });

    await browser.close();
    
    console.log(`[scrapeUrl] ✅ Scraping completed in ${Date.now() - startTime}ms`);
    console.log(`[scrapeUrl] Extracted ${scrapedData.content.length} characters of content`);

    return scrapedData;
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
