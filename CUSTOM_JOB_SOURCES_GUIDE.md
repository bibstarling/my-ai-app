# 🌐 Custom Job Sources - Complete Guide

## Overview

You can now manually add any job board website as a source! The system supports:
- 📰 **RSS Feeds** (easiest - just paste the RSS URL)
- 🌐 **HTML Pages** (scrapes job listings from websites)
- 🔌 **JSON APIs** (fetches from custom APIs)

## Quick Start

### 1. Access Job Sources

Navigate to: **Admin → Job Sources**

```
http://localhost:3002/admin/jobs/sources
```

---

### 2. Add Your First Source

Click **"Add Source"** and fill in:

#### For RSS Feeds (Recommended):
```
Name: WeWorkRemotely Programming
URL: https://weworkremotely.com/categories/remote-programming-jobs/rss
Type: RSS Feed
Description: Remote programming jobs from WWR
```

#### For HTML Pages (Advanced):
```
Name: RemoteHub
URL: https://remotehub.com/jobs
Type: HTML List
Description: Tech jobs from RemoteHub
```

---

### 3. Test The Source

Click the **▶️ Play** button to test scraping:
- ✅ **Success**: Shows how many jobs were found
- ❌ **Failed**: Shows error message to help debug

---

### 4. Enable & Run

- Toggle to **Enabled** (green badge)
- Source will be included in daily pipeline runs
- Jobs are automatically scraped every 24 hours

---

## Supported Source Types

### 📰 RSS Feeds (Easiest)

**Best for**: Job boards that provide RSS feeds

**Examples**:
- WeWorkRemotely: `https://weworkremotely.com/categories/remote-programming-jobs/rss`
- RemoteOK (alternative): `https://remoteok.com/remote-dev-jobs.rss`
- AngelList: `https://angel.co/jobs/rss`

**How it works**:
- Automatically parses standard RSS format
- Extracts title, description, link, date
- No configuration needed!

**Default RSS Tags**:
```xml
<item>
  <title>Job Title</title>
  <description>Job description...</description>
  <link>https://apply.url</link>
  <pubDate>Mon, 01 Jan 2024</pubDate>
</item>
```

---

### 🌐 HTML Pages (Advanced)

**Best for**: Job boards without RSS feeds

**Examples**:
- Company career pages
- Job aggregator sites
- Custom job boards

**How it works**:
- Uses CSS selectors to find job elements
- Extracts data from HTML structure
- Requires configuration (future feature)

**Current Limitations**:
- Uses default selectors (`.job-listing`, `h2`, `.company`)
- Advanced configuration UI coming soon
- Works best with standard job board layouts

---

### 🔌 JSON APIs (Advanced)

**Best for**: Custom APIs or modern job boards

**Examples**:
- Internal company APIs
- Headless job boards
- JSON feeds

**How it works**:
- Fetches JSON data
- Maps fields to job properties
- Requires configuration (future feature)

---

## How It Integrates

### Daily Pipeline

Your custom sources are automatically included in the daily job ingestion:

```
1. Daily Pipeline Runs (midnight)
   ↓
2. Fetches from API sources (RemoteOK, Remotive)
   ↓
3. Fetches from YOUR custom sources
   ↓
4. Normalizes all jobs
   ↓
5. Deduplicates
   ↓
6. Jobs available in discovery!
```

### Manual Testing

Before enabling a source, test it:

```
1. Add source
   ↓
2. Click ▶️ Test button
   ↓
3. System attempts to scrape
   ↓
4. Shows: ✅ 25 jobs found OR ❌ Error message
   ↓
5. Enable source if test passes
```

---

## Database Schema

### `custom_job_sources` Table

```sql
CREATE TABLE custom_job_sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,                    -- Source name
  url TEXT NOT NULL UNIQUE,              -- Source URL
  description TEXT,                      -- Optional description
  source_type TEXT NOT NULL,             -- 'rss', 'html_list', 'json_api'
  config JSONB DEFAULT '{}',             -- Scraping config
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,                 -- 'success', 'failed'
  last_sync_jobs_count INTEGER,
  last_error TEXT,
  
  -- Metadata
  added_by TEXT NOT NULL,                -- Admin who added it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### List Sources
```
GET /api/admin/jobs/sources
```

### Add Source
```
POST /api/admin/jobs/sources
Body: {
  "name": "Source Name",
  "url": "https://...",
  "source_type": "rss",
  "description": "Optional"
}
```

### Update Source
```
PATCH /api/admin/jobs/sources/:id
Body: {
  "enabled": true/false
}
```

### Delete Source
```
DELETE /api/admin/jobs/sources/:id
```

### Test Source
```
POST /api/admin/jobs/sources/:id/test
Returns: {
  "success": true,
  "jobs_count": 25,
  "sample_jobs": [...]
}
```

---

## Finding RSS Feeds

### How to Find RSS Feeds

1. **Check Common Paths**:
   - `https://example.com/jobs/rss`
   - `https://example.com/feed`
   - `https://example.com/rss.xml`

2. **Look for RSS Icons**: 📰 or 🔔 buttons on job pages

3. **View Page Source**: Search for "rss" or "feed"

4. **Browser Extensions**: RSS feed detectors

### Popular Job Board RSS Feeds

```
WeWorkRemotely:
https://weworkremotely.com/categories/remote-programming-jobs/rss

RemoteOK:
https://remoteok.com/remote-dev-jobs.rss

Stack Overflow:
https://stackoverflow.com/jobs/feed

Indeed:
https://www.indeed.com/rss?q=developer+remote

GitHub Jobs (archived but example):
https://jobs.github.com/positions.atom
```

---

## Troubleshooting

### ❌ Test Failed: HTTP 403

**Cause**: Website blocks automated access

**Solutions**:
- Try RSS feed instead of HTML scraping
- Contact site admin for API access
- Some sites don't allow scraping

---

### ❌ Test Failed: No Jobs Found

**Cause**: 
- Wrong URL
- Site structure changed
- Selectors don't match

**Solutions**:
- Verify URL in browser
- Check if RSS feed exists
- Try different source type

---

### ❌ Test Failed: Invalid XML/JSON

**Cause**: Feed is malformed or not in expected format

**Solutions**:
- Verify it's actually an RSS feed
- Check URL returns valid content
- Try HTML scraping instead

---

### ⚠️ Source Disabled Automatically

**Cause**: Multiple failed sync attempts

**Solutions**:
- Click Test to see current error
- Fix URL or configuration
- Re-enable after fixing

---

## Best Practices

### ✅ DO:
- **Test before enabling** - Always click ▶️ Test button
- **Add description** - Help future admins understand the source
- **Monitor status** - Check dashboard for failed syncs
- **Start with RSS** - Easiest and most reliable
- **Use descriptive names** - "WWR Programming" not "Source 1"

### ❌ DON'T:
- **Don't add duplicates** - Check if source already exists
- **Don't scrape aggressively** - Respect site's terms of service
- **Don't ignore failures** - Fix broken sources promptly
- **Don't add low-quality sources** - Quality over quantity
- **Don't enable untested sources** - Always test first

---

## Advanced Configuration (Coming Soon)

Future versions will support custom selectors:

```json
{
  "jobSelector": ".job-card",
  "titleSelector": "h2.job-title",
  "companySelector": ".company-name",
  "locationSelector": ".location",
  "urlSelector": "a.apply-button",
  "pagination": {
    "enabled": true,
    "maxPages": 5
  }
}
```

---

## Example Sources to Add

### 1. WeWorkRemotely
```
Name: WeWorkRemotely - Programming
URL: https://weworkremotely.com/categories/remote-programming-jobs/rss
Type: RSS Feed
Description: Curated remote programming jobs
```

### 2. Remotive
```
Name: Remotive Software Dev
URL: https://remotive.com/remote-jobs/software-dev/feed
Type: RSS Feed
Description: Remote software development positions
```

### 3. Hacker News Who's Hiring
```
Name: HN Who's Hiring
URL: https://news.ycombinator.com/jobs/rss
Type: RSS Feed
Description: Startup jobs from Hacker News
```

### 4. Dribbble (Design)
```
Name: Dribbble Jobs
URL: https://dribbble.com/jobs.rss
Type: RSS Feed
Description: Design and creative jobs
```

---

## Monitoring & Maintenance

### Dashboard Indicators

**Green Badge (Enabled)**:
- ✅ Source is active
- ✅ Will run in daily pipeline
- ✅ Contributing jobs to discovery

**Gray Badge (Disabled)**:
- ⚠️ Source is paused
- ⚠️ Not running in pipeline
- ⚠️ No jobs being fetched

**Status Icons**:
- ✅ Green checkmark = Last sync successful
- ❌ Red X = Last sync failed
- ⏰ Clock = Never synced

### Sync Schedule

- **Daily Pipeline**: Runs at midnight
- **Manual Test**: Anytime via ▶️ button
- **Auto-disable**: After 3 consecutive failures
- **Re-check**: Failed sources retried every 24h

---

## Success Indicators

After adding a source:

✅ **Test successful** (shows job count)  
✅ **Source enabled** (green badge)  
✅ **Last sync shows success** (green checkmark)  
✅ **Jobs count > 0** (actual jobs found)  
✅ **Jobs appear in discovery** (can find them)  

---

## Coming Soon

🚀 **Custom Selectors UI** - Configure HTML/JSON scraping visually  
🚀 **Source Templates** - Pre-configured popular job boards  
🚀 **Source Analytics** - Track performance per source  
🚀 **Auto-detection** - Paste URL, system detects RSS/type  
🚀 **Bulk Import** - Add multiple sources from CSV  

---

**Status**: ✅ Ready to use!

**Action**: Add your first custom job source and expand your job database! 🎉
