# Portfolio URL Extraction Fix

## Problem
Portfolio URLs were not showing up in generated resumes even though users had them in their markdown portfolios. The root cause was that the structured `portfolio_data` JSON wasn't being automatically parsed from markdown to extract fields like `websiteUrl`, `fullName`, `email`, etc.

## Root Cause Analysis

### How It Was Working
1. User creates portfolio by chatting with AI assistant
2. AI generates markdown content with contact info (including website URL)
3. Markdown is saved to database in `user_portfolios.markdown` field
4. Portfolio data JSON (`user_portfolios.portfolio_data`) was NOT being updated with structured fields

### Resume Generation Flow
When generating resumes, the code tried to extract:
```typescript
portfolioInfo.websiteUrl || portfolioInfo.website || ...
```

But `portfolioInfo` (from `portfolio_data` JSON) didn't have these fields because markdown was never parsed.

## Solution

### 1. **Auto-Parse Markdown on Save** (`app/api/portfolio/update/route.ts`)

Added automatic markdown parsing whenever portfolio markdown is updated:

```typescript
// If markdown is being updated, automatically parse it to extract structured data
if (markdown && markdown !== portfolio.markdown) {
  const parseRes = await fetch('/api/portfolio/parse-markdown', {
    method: 'POST',
    body: JSON.stringify({ markdown }),
  });
  
  if (parseRes.ok) {
    const parseData = await parseRes.json();
    // Merge parsed data with existing portfolio data
    finalPortfolioData = {
      ...portfolioData,
      ...parseData.portfolioData,
      markdown,
    };
  }
}
```

**Extracted Fields:**
- `fullName`
- `title`
- `tagline`
- `email`
- `location`
- `linkedinUrl`
- **`websiteUrl`** ← The missing field!
- `githubUrl`
- `about`
- `experiences[]`
- `projects[]`
- `skills[]`
- `education[]`
- `awards[]`
- etc.

### 2. **Enhanced Portfolio URL Extraction** (`app/api/resume/generate/route.ts`)

Made the URL extraction more robust by checking multiple field names:

```typescript
portfolioUrl = 
  portfolioInfo?.websiteUrl || 
  portfolioInfo?.website || 
  portfolioInfo?.portfolio_url ||
  portfolioInfo?.portfolioUrl ||
  userPortfolio?.portfolio_data?.websiteUrl || 
  userPortfolio?.portfolio_data?.website ||
  userPortfolio?.portfolio_data?.portfolio_url ||
  userPortfolio?.portfolio_data?.portfolioUrl ||
  null;
```

### 3. **Added Comprehensive Logging**

```typescript
console.log('[Resume Generate] Portfolio URL extracted:', {
  portfolioUrl,
  hasPortfolioInfo: !!portfolioInfo,
  portfolioInfoKeys: Object.keys(portfolioInfo),
  hasUserPortfolio: !!userPortfolio,
});

console.log('[Resume Generate] Resume created successfully:', {
  resumeId: resume.id,
  portfolioUrlSaved: resume.portfolio_url,
  portfolioUrlInput: portfolioUrl,
});
```

## How It Works Now

### For New Portfolio Saves
1. ✅ User updates portfolio markdown
2. ✅ **AUTO**: Markdown is parsed to extract structured data
3. ✅ Structured data (including `websiteUrl`) saved to `portfolio_data` JSON
4. ✅ Resume generation reads `websiteUrl` from `portfolio_data`
5. ✅ Portfolio URL appears in generated resume

### For Existing Portfolios
Users need to **trigger a save** to parse their existing markdown:
1. Open Portfolio Builder
2. Make any small edit (add a space, etc.)
3. Save portfolio
4. Markdown will be parsed and `websiteUrl` extracted

## Files Modified

### `app/api/portfolio/update/route.ts`
- **Added**: Automatic markdown parsing when markdown changes
- **Added**: Merging of parsed structured data with portfolio_data
- **Added**: Logging of extracted fields
- **Result**: Portfolio URL and other contact fields now automatically extracted

### `app/api/resume/generate/route.ts`
- **Added**: Multiple fallback field names for portfolio URL
- **Added**: Comprehensive debugging logs
- **Added**: Portfolio URL extraction confirmation logs
- **Result**: More robust URL extraction with better debugging

## Testing

### To Verify Fix Works
1. **For new users**: Create portfolio with website URL → Generate resume → URL should appear
2. **For existing users with markdown**: Edit portfolio → Save → Generate resume → URL should appear
3. **Check logs**: Look for "[Portfolio Update] Successfully parsed markdown" message
4. **Check database**: `portfolio_data` JSON should have `websiteUrl` field after save

### Debug Checklist
If portfolio URL still missing:
1. Check logs for "[Resume Generate] Portfolio URL extracted"
2. Verify markdown contains website URL
3. Trigger portfolio save to parse markdown
4. Check `portfolio_data` JSON in database has `websiteUrl` field
5. Verify `websiteUrl` isn't null or empty string

## Backward Compatibility

✅ **Existing portfolios**: Still work, but need one save to extract URL  
✅ **Super admin**: Still uses hardcoded URL  
✅ **Empty markdown**: Doesn't break, uses existing portfolio_data  
✅ **Parse failure**: Falls back to original data gracefully  

## Impact

✅ **Portfolio URLs now automatically extracted** from markdown  
✅ **All contact fields extracted**: name, email, location, LinkedIn, website  
✅ **Structured data kept in sync** with markdown content  
✅ **Better debugging** with comprehensive logs  
✅ **Robust extraction** with multiple field name fallbacks  

## Next Steps

Optional improvements for future:
1. Add migration script to parse all existing portfolios
2. Show warning in UI if portfolio has no website URL
3. Add manual "Extract structured data" button in portfolio builder
4. Auto-parse on chat updates (not just manual saves)
