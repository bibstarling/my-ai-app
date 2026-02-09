# Vercel Deployment Guide - Web Scraping

## Pre-Deployment Checklist

### ✅ Code Changes (Completed)
- [x] Installed `@sparticuz/chromium` and `puppeteer-core`
- [x] Updated `lib/url-scraper.ts` for serverless compatibility
- [x] Configured `vercel.json` with function limits
- [x] Added logging for production debugging
- [x] Updated AI assistant to support scraping actions

### 🔍 Test Locally First

Before deploying, test the scraping locally:

```bash
# Start dev server
npm run dev

# Open AI Assistant (Cmd/Ctrl + K)
# Try: "Scrape https://example.com"
```

Check console logs for:
- `[getBrowser] Environment: development`
- `[scrapeUrl] Starting scrape for: ...`
- `[scrapeUrl] ✅ Scraping completed in ...`

## Deployment Steps

### 1. Verify Vercel Plan

**IMPORTANT**: Web scraping requires **Vercel Pro** or higher ($20/month).

Check your plan at: https://vercel.com/account/billing

**Why Pro is needed:**
- Memory: 3008MB (Hobby allows max 1024MB)
- Timeout: 60s (Hobby allows max 10s)
- Chromium needs ~1.5GB RAM to run

### 2. Deploy to Vercel

```bash
# If you have Vercel CLI installed
vercel --prod

# Or push to GitHub (if using Git integration)
git add .
git commit -m "Add web scraping support for AI agent"
git push origin main
```

### 3. Monitor Deployment

Watch the build logs at: https://vercel.com/dashboard

Look for:
- `@sparticuz/chromium` package installation
- Function size warnings (deployment will be ~50MB larger)
- Build success ✓

### 4. Test in Production

After deployment:

1. Open your production site
2. Open AI Assistant (Cmd/Ctrl + K)
3. Try: "Scrape https://example.com"
4. Check Vercel function logs:
   - Go to: https://vercel.com/dashboard
   - Click your project → Functions → `api/portfolio/scrape`
   - Look for logs with `[scrapeUrl]` prefix

### Expected Behavior

**Success:**
```
[getBrowser] Environment: production
[getBrowser] Loading serverless chromium...
[getBrowser] Chromium executable: /tmp/chromium-...
[scrapeUrl] Browser launched in 2500ms
[scrapeUrl] Page loaded in 5000ms
[scrapeUrl] ✅ Scraping completed in 6000ms
```

**Common Errors:**

1. **Memory Limit Exceeded**
   ```
   Error: Function exceeded memory limit
   ```
   **Fix**: Upgrade to Pro plan or higher

2. **Timeout**
   ```
   Error: Function execution timed out after 10s
   ```
   **Fix**: Upgrade to Pro plan (Hobby has 10s limit)

3. **Chromium Not Found**
   ```
   Failed to initialize browser in production
   ```
   **Fix**: Ensure `@sparticuz/chromium` is in dependencies (not devDependencies)

## Optimization Tips

### Reduce Cold Start Time

Add to `vercel.json`:
```json
{
  "functions": {
    "app/api/portfolio/scrape/route.ts": {
      "maxDuration": 60,
      "memory": 3008,
      "regions": ["iad1"]
    }
  }
}
```

Pinning to one region (`iad1` = Virginia) reduces cold starts.

### Monitor Costs

Web scraping is resource-intensive:
- Each scrape: ~3-6 seconds function time
- Memory: 3GB per execution
- Adds ~50MB to deployment size

**Estimated costs** (Vercel Pro plan):
- Function execution: $0.18 per GB-hour
- 1000 scrapes/month ≈ $0.50-$1.00

Monitor at: https://vercel.com/dashboard/usage

### Alternative: External Scraping Service

If costs are too high, consider:

1. **ScrapingBee** (https://www.scrapingbee.com)
   - 1000 API credits free/month
   - $49/month for 150k credits
   - No need for Chromium/memory

2. **ScraperAPI** (https://www.scraperapi.com)
   - 5000 free requests/month
   - $49/month for 1M requests

3. **Browserless.io** (https://www.browserless.io)
   - Hosted Chromium instance
   - $20-$40/month

To use external service, update `lib/url-scraper.ts`:
```typescript
// Example with ScrapingBee
const response = await fetch(
  `https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=${encodeURIComponent(url)}`
);
const html = await response.text();
// Parse HTML with cheerio instead of puppeteer
```

## Troubleshooting Production Issues

### Enable Debug Logs

Add to `.env.production`:
```
DEBUG=puppeteer:*
```

### Check Function Logs

```bash
# Using Vercel CLI
vercel logs --follow

# Or view in dashboard
# https://vercel.com/dashboard → Project → Functions → Logs
```

### Test Specific URL

```bash
curl -X POST https://your-app.vercel.app/api/portfolio/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "portfolioId": "YOUR_ID"}'
```

## Rollback Plan

If scraping fails in production:

1. **Quick fix**: Disable scraping in AI assistant
   ```typescript
   // In app/api/assistant/global/route.ts
   // Comment out the scrape_url action
   ```

2. **Redeploy previous version**:
   ```bash
   vercel rollback
   ```

3. **Switch to external API**: See "Alternative" section above

## Next Steps After Deployment

- [ ] Test scraping 5-10 different websites
- [ ] Monitor function execution time and memory
- [ ] Check error rates in Vercel dashboard
- [ ] Set up alerts for failed scrapes
- [ ] Consider caching frequently scraped URLs
- [ ] Add rate limiting to prevent abuse
