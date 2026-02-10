# Quick Start: Job Intelligence Platform

This guide will get your Job Intelligence Platform up and running in 10 minutes.

## Prerequisites

✅ You already have:
- Next.js app running
- Supabase configured
- Clerk authentication
- Anthropic API key (for AI features)

## Setup Steps

### 1. Apply Database Migration (2 minutes)

1. Open your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Open the file: `supabase/migrations/20260212000000_job_intelligence_schema_updates.sql`
3. Copy and paste the entire content into the SQL Editor
4. Click "Run"

This creates all necessary tables: `user_job_profiles`, `matches`, `user_queries`, `job_merge_log`

### 2. (Optional) Add API Keys (1 minute)

Add these to your `.env.local` for enhanced job coverage:

```bash
# Adzuna - Global job board with salary data
ADZUNA_API_KEY=your_key_here
ADZUNA_APP_ID=your_app_id_here

# GetOnBoard - LATAM-focused tech jobs
GETONBOARD_API_KEY=your_key_here
```

**Get API Keys**:
- Adzuna: https://developer.adzuna.com/ (free tier available)
- GetOnBoard: https://www.getonbrd.com/api (optional, enhances LATAM coverage)

**Note**: RemoteOK and Remotive don't require API keys!

### 3. Restart Dev Server (30 seconds)

```bash
npm run dev
```

### 4. Run Your First Job Ingestion (3 minutes)

**Option A: Via Admin Dashboard (Recommended)**
1. Navigate to: http://localhost:3000/admin/jobs
2. Click "Run Pipeline"
3. Wait 2-5 minutes for completion
4. You should see ~500-1000 jobs ingested

**Option B: Via API**
```bash
curl -X POST http://localhost:3000/api/admin/jobs/pipeline \
  -H "Cookie: YOUR_CLERK_SESSION_COOKIE"
```

### 5. Set Up Your Job Profile (2 minutes)

1. Go to: http://localhost:3000/job-profile
2. Either:
   - **Quick**: Paste your resume → Click "Parse Resume with AI"
   - **Manual**: Add skills, target titles, preferences manually
3. Review and edit extracted data
4. (Optional) Add profile context for personalized matching
5. Click "Save Profile"

### 6. Discover Jobs! (30 seconds)

1. Go to: http://localhost:3000/jobs/discover
2. Choose a discovery mode:
   - **Personalized Discovery**: See jobs ranked for YOU
   - **Manual Search**: Enter any query
3. Click "Discover Jobs"
4. See ranked results with match percentages and explanations!

## What You Can Do Now

### For Job Seekers:
- ✅ **Discover personalized jobs** based on your profile
- ✅ **See match percentages** and "Why this job?" explanations
- ✅ **Filter by remote type**, seniority, language, date
- ✅ **Save jobs** to track application progress
- ✅ **Generate tailored resumes** for each job
- ✅ **Track applications** through your pipeline

### For Admins:
- ✅ **Monitor ingestion health** via dashboard
- ✅ **View source metrics** (jobs fetched, errors, duplicates)
- ✅ **Run pipeline on-demand** or schedule with cron
- ✅ **Audit deduplication** via merge logs

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Job Intelligence Platform                │
└─────────────────────────────────────────────────────────────┘

1. INGESTION (lib/jobs-ingestion/)
   ├─ RemoteOK Worker ──→ Fetch jobs from RemoteOK API
   ├─ Remotive Worker ──→ Fetch jobs from Remotive API
   ├─ Adzuna Worker ────→ Fetch jobs from Adzuna API
   └─ GetOnBoard Worker → Fetch LATAM jobs from GetOnBoard API
                ↓
2. NORMALIZATION (normalization-service.ts)
   ├─ Clean titles
   ├─ Detect seniority
   ├─ Extract skills
   ├─ Parse locations
   └─ Detect language
                ↓
3. DEDUPLICATION (deduplication-service.ts)
   ├─ Generate fingerprint
   ├─ Find duplicates (exact + fuzzy)
   └─ Merge into canonical jobs
                ↓
4. STORAGE (PostgreSQL)
   ├─ jobs (canonical source of truth)
   ├─ job_sources (provenance)
   └─ job_sync_metrics (health)
                ↓
5. RANKING (ranking-service.ts)
   ├─ Eligibility gates (remote type, location, auth)
   ├─ Scoring (title, skills, seniority, freshness)
   └─ Explainability (top 5 reasons)
                ↓
6. DISCOVERY (UI)
   ├─ Personalized mode (profile-based)
   ├─ Manual query mode (search-based)
   └─ Filters (remote, seniority, language, date)
```

## Key Features Explained

### 1. Deduplication
**Problem**: Same job appears on multiple boards.
**Solution**: We fingerprint each job (company + title hash) and use similarity scoring to merge duplicates into one canonical job.

**Example**: "Senior Product Manager" at "Acme Inc" from RemoteOK and "Sr Product Manager - Acme" from Remotive → Merged into 1 job

### 2. Explainable Ranking
**Problem**: Why is this job a 92% match?
**Solution**: We show the top reasons:
- "Strong skill match: React, TypeScript, Node.js"
- "Job title closely matches your target roles"
- "Posted within the last 3 days"

### 3. Profile Context Toggle
**Problem**: Generic matching misses career goals.
**Solution**: Optional "Profile Context" lets you add goals like "I want to work in AI/ML at early-stage startups." Toggle it on/off per search.

### 4. Two Discovery Modes
- **Personalized**: Uses your profile to rank ALL jobs by fit
- **Manual Query**: Your query drives search, profile only for eligibility

## Common Issues

### "No jobs showing up after ingestion"
**Check**:
1. Admin dashboard shows successful sync?
2. `job_sync_metrics` table has rows?
3. Run: `SELECT COUNT(*) FROM jobs WHERE status = 'active';` in Supabase SQL Editor

### "Match percentages are low"
**Fix**:
1. Add more skills to your profile
2. Broaden target titles (e.g., add "Product Manager" if you only have "Senior PM")
3. Enable profile context toggle

### "Errors in admin dashboard"
**Common causes**:
- Adzuna API key invalid → Check environment variable
- Rate limits hit → Wait and retry
- API schema changed → Check worker implementation

## Next Steps

### Phase 2 Enhancements (Optional)
- [ ] Add more job sources (LinkedIn, Indeed, etc.)
- [ ] Implement semantic search with embeddings
- [ ] Add job alerts and email digests
- [ ] Build Chrome extension for one-click save

### Automated Ingestion
Set up a cron job to run daily:

**Vercel Cron** (if deployed):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/admin/jobs/pipeline",
    "schedule": "0 2 * * *"  // 2 AM daily
  }]
}
```

**Or use GitHub Actions**:
```yaml
# .github/workflows/job-ingestion.yml
name: Job Ingestion
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:  # Manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Pipeline
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/admin/jobs/pipeline \
            -H "Authorization: Bearer ${{ secrets.ADMIN_API_KEY }}"
```

## Documentation

- **Full Documentation**: `docs/JOB_INTELLIGENCE_PLATFORM.md`
- **PRD Reference**: Your original Product Requirements Document
- **Code Structure**: All code is in `lib/jobs-ingestion/` and `app/api/`

## Support

Questions? Check:
1. `docs/JOB_INTELLIGENCE_PLATFORM.md` - Comprehensive guide
2. Admin dashboard - Real-time health metrics
3. Supabase logs - Database query logs
4. Server console - Application logs

## Success! 🎉

You now have a fully functional Job Intelligence Platform that:
- ✅ Aggregates jobs from 4+ sources
- ✅ Deduplicates into single source of truth
- ✅ Ranks by eligibility and fit (not just keywords)
- ✅ Explains match reasons
- ✅ Integrates with resume/cover letter generation

Happy job hunting! 🚀
