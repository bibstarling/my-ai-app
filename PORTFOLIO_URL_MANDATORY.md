# Portfolio URL Always Included in Resumes

## Change Summary
Made portfolio URL inclusion **mandatory and automatic** in all generated resumes when available in user profile. This is non-negotiable.

## Problem
Portfolio URLs were conditionally included based on a user preference flag that defaulted to `false`, meaning resumes were being generated without portfolio links even when users had them in their profiles.

## Solution

### 1. **Always Include Portfolio URL** (`app/api/resume/generate/route.ts`)
**Before:**
```typescript
const includePortfolioLink = userPortfolio?.include_portfolio_link ?? false;
const portfolioUrl = includePortfolioLink
  ? userInfo?.is_super_admin
    ? 'www.biancastarling.com'
    : portfolioInfo.websiteUrl || null
  : portfolioInfo.websiteUrl || null;
```

**After:**
```typescript
// ALWAYS include portfolio URL if available (non-negotiable)
const portfolioUrl = userInfo?.is_super_admin
  ? 'www.biancastarling.com'
  : portfolioInfo.websiteUrl || portfolioInfo.website || userPortfolio?.portfolio_data?.websiteUrl || null;
```

### 2. **Updated AI Prompts** (All resume generation endpoints)
Added explicit instructions to all AI prompts:

```
📌 MANDATORY - PORTFOLIO URL:
- The candidate's portfolio URL will be AUTOMATICALLY included in the resume header
- Contact information (name, email, location, LinkedIn, portfolio) is handled separately
- Portfolio URL is NON-NEGOTIABLE and will ALWAYS be displayed if available
```

## Files Modified

1. **`app/api/resume/generate/route.ts`**
   - Removed conditional logic for portfolio URL inclusion
   - Always extracts portfolio URL from user profile
   - Added AI prompt instructions emphasizing automatic inclusion

2. **`app/api/jobs/tailor-resume/route.ts`**
   - Added AI prompt instructions about automatic portfolio URL inclusion
   - Portfolio URL already saved correctly in database

3. **`app/api/resume/adapt/route.ts`**
   - Added AI prompt instructions about automatic portfolio URL inclusion
   - Portfolio URL preserved from original resume

## How It Works

### Resume Header Display
The portfolio URL is stored at the resume level (not in sections) and automatically displayed in:

1. **Resume Editor** (`app/resume-builder/[id]/page.tsx`)
   ```tsx
   <input
     type="url"
     placeholder="Portfolio URL"
     value={resume.portfolio_url || ''}
     onChange={(e) => updateResumeInfo('portfolio_url', e.target.value)}
   />
   ```

2. **Resume Preview** (`app/resume-builder/[id]/preview/page.tsx`)
   ```tsx
   {resume.portfolio_url && (
     <div className="flex items-center gap-1.5">
       <Globe className="w-4 h-4" />
       <a href={resume.portfolio_url} className="text-blue-600 hover:underline">
         Portfolio
       </a>
     </div>
   )}
   ```

3. **PDF Export**
   - Uses the same preview page
   - Portfolio URL appears in the contact header
   - Automatically included when using browser print dialog

## Database Fields
Portfolio URL is stored in the `resumes` table:
```sql
portfolio_url TEXT
```

Contact information fields:
- `full_name`
- `email`
- `phone`
- `location`
- `linkedin_url`
- `portfolio_url` ← **ALWAYS included if available**

## Impact

✅ **All generated resumes now automatically include portfolio URL** when available  
✅ **No user configuration needed** - automatic and non-negotiable  
✅ **Works across all generation methods:**
   - Resume generation from job (`/api/resume/generate`)
   - Resume tailoring (`/api/jobs/tailor-resume`)
   - Resume adaptation (`/api/resume/adapt`)

✅ **Visible in all views:**
   - Resume editor
   - Resume preview
   - PDF exports

## Portfolio URL Extraction Priority

The system checks multiple sources for portfolio URL (in order):
1. Super admin: Uses hardcoded `www.biancastarling.com`
2. Portfolio data: `portfolioInfo.websiteUrl`
3. Fallback: `portfolioInfo.website`
4. Nested: `userPortfolio?.portfolio_data?.websiteUrl`

## Testing
- [x] Portfolio URL saved in database during resume generation
- [x] Portfolio URL displayed in resume editor
- [x] Portfolio URL displayed in resume preview
- [x] Portfolio URL included in PDF exports
- [x] Works for all resume generation endpoints
- [x] No placeholders or missing URLs

## Notes
- Portfolio URL is **non-negotiable** as requested
- Removed the `include_portfolio_link` preference flag logic
- AI is informed that contact info is handled separately
- Focus remains on generating quality resume content (summary, experience, skills, education)
