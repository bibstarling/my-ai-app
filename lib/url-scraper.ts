import puppeteer, { Browser, Page } from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
 * Scrape a URL and extract content
 */
export async function scrapeUrl(url: string): Promise<ScrapedData> {
  let browser: Browser | null = null;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    });

    const page: Page = await browser.newPage();
    
    // Set user agent to avoid being blocked
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Extract data from page
    const scrapedData = await page.evaluate(() => {
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
          ogTitle,
          ogDescription,
          ogImage,
          favicon,
          author,
          publishDate,
        },
      };
    });

    await browser.close();

    return scrapedData;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    console.error('Error scraping URL:', error);
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze scraped content with AI to extract relevant portfolio information
 */
export async function analyzeScrapedContent(
  url: string,
  scrapedData: ScrapedData
): Promise<any> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
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
      ]
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

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
