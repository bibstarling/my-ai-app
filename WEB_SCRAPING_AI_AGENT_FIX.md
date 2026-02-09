# Web Scraping in AI Agent - Fix Summary

## Problem
The AI agent could not perform web scraping even though the scraping functionality existed in the codebase. When users asked the AI to scrape websites, it had no action available to trigger the scraping.

## Root Cause
The Global AI Assistant had a limited set of actions defined in `/app/api/assistant/global/route.ts`:
- `navigate` - Navigate to pages
- `search_jobs` - Search for jobs
- `generate_resume` - Generate resumes
- `create_job` - Track job applications

**Missing**: `scrape_url` action to trigger web scraping

## Solution Implemented

### 1. Updated AI Assistant System Prompt
**File**: `app/api/assistant/global/route.ts`

Added a new action type to the AI's available actions:
```typescript
5. **Scrape URL**: Extract content from a website URL
   - { "type": "scrape_url", "url": "https://example.com", "portfolioId": "optional-portfolio-id" }
   - Use this when users ask to scrape, extract, or analyze content from a website
```

Updated guidelines to include:
```
- If user asks to scrape/extract/analyze a website, use scrape_url action
```

### 2. Added Action Handler in Frontend
**File**: `app/components/GlobalAIAssistant.tsx`

Added `scrape_url` case in `handleAction()` function:
- Displays scraping status to user
- Automatically fetches user's portfolio ID if not provided
- Calls `/api/portfolio/scrape` endpoint
- Shows success/error messages with scraped content details

### 3. Updated UI
**File**: `app/components/GlobalAIAssistant.tsx`

- Added web scraping to welcome message
- Added "Scrape URL" quick action button
- Imported `Globe` icon from lucide-react

## How to Use

Users can now ask the AI assistant to scrape websites in several ways:

1. **Direct URL**: "Scrape https://example.com"
2. **Extract content**: "Extract content from https://example.com"
3. **Analyze**: "Analyze the content at https://example.com"
4. **Quick Action**: Click the "Scrape URL" button in the assistant

## Technical Details

### Scraping Flow
1. User asks AI to scrape a URL
2. AI returns action: `{ type: "scrape_url", url: "..." }`
3. Frontend handler:
   - Gets user's portfolio ID from `/api/portfolio/current`
   - Calls `/api/portfolio/scrape` with URL and portfolio ID
   - Displays results
4. Backend (`/api/portfolio/scrape`):
   - Uses Puppeteer to scrape the URL
   - Extracts metadata (title, description, OG tags, etc.)
   - Analyzes content with AI
   - Saves to portfolio_links table

### Dependencies
- **Puppeteer**: `^24.37.1` (already installed)
- **AI Provider**: Uses centralized AI provider from `lib/ai-provider.ts`

## Important Notes

### ✅ Vercel Production Setup (COMPLETED)

The scraper has been configured to work on Vercel's serverless environment:

1. **Installed Dependencies**:
   ```bash
   npm install @sparticuz/chromium puppeteer-core
   ```

2. **Updated `lib/url-scraper.ts`**:
   - Uses `@sparticuz/chromium` in production (Vercel)
   - Uses regular `puppeteer` in development
   - Automatically detects environment with `process.env.NODE_ENV`

3. **Updated `vercel.json`**:
   ```json
   {
     "functions": {
       "app/api/portfolio/scrape/route.ts": {
         "maxDuration": 60,
         "memory": 3008
       }
     }
   }
   ```
   - Increased timeout to 60 seconds (scraping can be slow)
   - Increased memory to 3008MB (Chromium needs ~1.5GB)

### Portfolio Requirement
Web scraping requires a user portfolio to save the scraped content. If a user doesn't have a portfolio:
- The AI will inform them to create one first
- User should visit `/portfolio/builder` to create a portfolio

## Testing

Test the fix by:

1. Open the AI Assistant (Cmd/Ctrl + K)
2. Try these prompts:
   - "Scrape https://example.com"
   - "Extract content from https://github.com/vercel/next.js"
   - "Analyze https://react.dev"
3. Verify the assistant displays scraping progress and results

## Files Modified

1. `app/api/assistant/global/route.ts` - Added scrape_url action to system prompt
2. `app/components/GlobalAIAssistant.tsx` - Added action handler and UI updates
3. `lib/url-scraper.ts` - Updated to use serverless-compatible Chromium
4. `vercel.json` - Added function config for scraping endpoint
5. `package.json` - Added `@sparticuz/chromium` and `puppeteer-core`

## Deployment Checklist

- [x] Install serverless Chromium packages
- [x] Update scraper for production compatibility
- [x] Configure Vercel function limits
- [ ] Deploy to Vercel
- [ ] Test scraping in production
- [ ] Monitor function execution time and memory usage

### ⚠️ Vercel Plan Requirements

**Important**: The scraping function requires:
- **Memory**: 3008MB (3GB)
- **Timeout**: 60 seconds

This requires a **Vercel Pro plan** or higher. The Hobby (free) plan limits:
- Memory: 1024MB (not enough for Chromium)
- Timeout: 10 seconds (too short for scraping)

If you're on the Hobby plan, consider these alternatives:
1. **Upgrade to Pro**: $20/month per member
2. **Use a scraping API**: ScrapingBee, ScraperAPI, Browserless.io
3. **Self-host**: Deploy on Railway, Render, or DigitalOcean

## Next Steps

- [ ] Deploy to Vercel and test in production
- [ ] Add error handling for blocked/rate-limited sites
- [ ] Consider adding scraping options (e.g., depth, selectors)
- [ ] Add scraping history/management UI
- [ ] Monitor Chromium bundle size (adds ~50MB to deployment)
