# Database Migration Required

## Summary
The Professional Profile page now uses markdown content as the source of truth for all AI-generated content (resumes, cover letters, etc.). A new database column needs to be added to support this.

## Required Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add markdown column to user_portfolios table
ALTER TABLE user_portfolios
ADD COLUMN IF NOT EXISTS markdown TEXT;

COMMENT ON COLUMN user_portfolios.markdown IS 'Markdown content from Professional Profile page - source of truth for AI-generated content';
```

## What Was Fixed

### 1. **Professional Profile Page** (`app/portfolio/builder/page.tsx`)
- ✅ Renamed from "Portfolio" to "Professional Profile"
- ✅ Removed live page features (publish button, public/private toggle, view live button)
- ✅ Already saves markdown content correctly

### 2. **Resume Generation** (`app/api/resume/generate/route.ts`)
- ✅ Now fetches `markdown` field from `user_portfolios`
- ✅ Uses markdown content in AI prompts alongside structured data
- ✅ Super admin correctly uses hardcoded main page data (`portfolio-data.ts`)
- ✅ Converts structured data to markdown format for super admin

### 3. **Cover Letter Generation** (`app/api/cover-letter/generate/route.ts`)
- ✅ Fixed column name from `markdown_content` to `markdown`
- ✅ Uses markdown content as primary source
- ✅ Super admin correctly uses hardcoded main page data (`portfolio-data.ts`)
- ✅ Converts structured data to markdown format for super admin

### 4. **Portfolio Update API** (`app/api/portfolio/update/route.ts`)
- ✅ Now extracts and saves markdown field separately
- ✅ Updates both `portfolio_data` (JSONB) and `markdown` (TEXT) columns

### 5. **Navigation Menu** (`app/components/AppMenu.tsx`)
- ✅ Renamed "Portfolio" to "Profile" for consistency

## How It Works Now

### For Regular Users:
1. User writes content in the Professional Profile page (markdown editor)
2. Content is saved to the `markdown` column in `user_portfolios` table
3. When generating resumes/cover letters, the AI uses this markdown content
4. The markdown provides rich context for tailored content generation

### For Super Admin:
1. Super admin's profile still uses the hardcoded main page data from `lib/portfolio-data.ts`
2. The structured data is automatically converted to markdown format
3. This ensures super admin's public page (root `/`) stays in sync with generated content

## Benefits

- ✅ **Single Source of Truth**: Markdown content from Professional Profile powers all AI generation
- ✅ **More Detailed Context**: Users can provide rich, detailed information in markdown
- ✅ **Better AI Output**: More context = better tailored resumes and cover letters
- ✅ **Super Admin Support**: Admin content still comes from main page as expected
- ✅ **Clean Separation**: Live portfolio features removed, focus on content generation

## Testing Checklist

After applying the migration:

1. ✅ Open Professional Profile page - should show markdown editor
2. ✅ Write some content and save - should save successfully
3. ✅ Generate a resume - should use your markdown content
4. ✅ Generate a cover letter - should use your markdown content
5. ✅ (Super admin only) Verify main page data is used for generation

## Next Steps

1. Apply the SQL migration above in Supabase
2. Test the Professional Profile page
3. Generate a test resume to verify markdown is being used
4. Optional: Populate existing users' markdown from their portfolio_data
