# 🚀 Custom Job Sources - Setup Instructions

## Installation Steps

### 1. Install Dependencies

The custom scraper requires `cheerio` for HTML parsing:

```bash
npm install cheerio
npm install --save-dev @types/cheerio
```

### 2. Verify Database Migration

The migration has already been applied. Verify it exists:

```sql
-- Check if table exists
SELECT * FROM custom_job_sources LIMIT 1;
```

### 3. Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

---

## Quick Test

### 1. Access Sources Page

Navigate to: **http://localhost:3002/admin/jobs/sources**

You should see:
- ✅ "Custom Job Sources" header
- ✅ "Add Source" button
- ✅ Empty state (no sources yet)

### 2. Add First Source

Click **"Add Source"** and enter:

```
Name: WeWorkRemotely Programming
URL: https://weworkremotely.com/categories/remote-programming-jobs/rss
Type: RSS Feed
Description: Remote programming jobs from WeWorkRemotely
```

### 3. Test The Source

1. Click the **▶️ Play** (test) button
2. Wait ~5-10 seconds
3. Expected result: **"Test Successful! Found X jobs"**

### 4. Enable The Source

- Source should automatically be enabled (green "Enabled" badge)
- If not, click the pause button to toggle

### 5. Run Pipeline

Navigate to: **http://localhost:3002/admin/jobs**

1. Click **"Run Pipeline"**
2. Wait 4-5 minutes
3. Custom sources will be included!

---

## Troubleshooting

### ❌ "Module 'cheerio' not found"

**Solution**:
```bash
npm install cheerio @types/cheerio
```

### ❌ "Cannot find module '@/lib/jobs-ingestion/custom-scraper-worker'"

**Solution**: File might not be compiled yet
```bash
# Restart dev server
npm run dev
```

### ❌ "Table custom_job_sources does not exist"

**Solution**: Run migration manually
```bash
# Check Supabase dashboard → SQL Editor
# Migration should already be applied
```

---

## File Structure

New files created:

```
lib/jobs-ingestion/
├── custom-scraper-worker.ts          # Generic scraper

app/(dashboard)/admin/jobs/sources/
├── page.tsx                           # Sources management UI

app/api/admin/jobs/sources/
├── route.ts                           # List/Add sources API
└── [id]/
    ├── route.ts                       # Update/Delete API
    └── test/
        └── route.ts                   # Test scraper API
```

---

## Next Steps

1. ✅ Install cheerio
2. ✅ Restart dev server
3. ✅ Access sources page
4. ✅ Add first RSS feed
5. ✅ Test it works
6. ✅ Run pipeline to include custom sources

---

## Popular RSS Feeds to Add

Try these proven RSS feeds:

### 1. **WeWorkRemotely**
```
URL: https://weworkremotely.com/categories/remote-programming-jobs/rss
Type: RSS Feed
Jobs: ~50-100 daily
```

### 2. **Remotive**
```
URL: https://remotive.com/remote-jobs/software-dev/feed
Type: RSS Feed
Jobs: ~30-50 daily
```

### 3. **Stack Overflow**
```
URL: https://stackoverflow.com/jobs/feed
Type: RSS Feed
Jobs: ~20-40 daily
```

### 4. **AngelList**
```
URL: https://angel.co/jobs/rss
Type: RSS Feed
Jobs: ~15-30 daily
```

---

**Status**: Ready to implement!

**Time to Complete**: ~5 minutes

**Action**: Run `npm install cheerio` and restart server! 🚀
