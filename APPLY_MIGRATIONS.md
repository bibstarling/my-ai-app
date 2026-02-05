# Apply Database Migrations

Your Supabase project is configured, but the tables haven't been created yet.

## Quick Setup (5 minutes)

### Option 1: Manual (Recommended - Most Reliable)

1. **Go to SQL Editor**: https://supabase.com/dashboard/project/qtplretigutndftokplk/sql/new

2. **Copy and run each migration** in order:

   **Migration 1**: Job Ingestion Schema
   - File: `supabase/migrations/20260204000000_job_ingestion_schema.sql`
   - Creates: `jobs`, `job_sources`, `job_sync_metrics`, `user_job_profiles`

   **Migration 2**: Resume Builder Schema  
   - File: `supabase/migrations/20260204100000_resume_builder_schema.sql`
   - Creates: `resumes`, `resume_sections`, `resume_adaptations`

   **Migration 3**: Cover Letter Schema
   - File: `supabase/migrations/20260204110000_cover_letter_schema.sql`
   - Creates: `cover_letters`

   **Migration 4**: Tracked Jobs  
   - File: `supabase/migrations/20260205_create_tracked_jobs.sql`
   - Creates: `tracked_jobs`

3. **Verify**: After running all migrations, go to Table Editor and you should see all tables!

### Option 2: Using Node Script

```bash
node scripts/run-migrations.mjs
```

This will attempt to apply migrations programmatically, but may fall back to manual instructions.

## What Gets Created

After applying migrations, you'll have these tables:

✓ **jobs** - Job listings from RemoteOK, Remotive, Adzuna
✓ **job_sources** - Raw API data from job boards  
✓ **job_sync_metrics** - Sync status tracking
✓ **user_job_profiles** - User skills and preferences
✓ **resumes** - User resume records
✓ **resume_sections** - Resume content (experience, education, etc.)
✓ **resume_adaptations** - Job-specific tailored resumes
✓ **cover_letters** - AI-generated cover letters
✓ **tracked_jobs** - User's saved/applied jobs with kanban status

## Verify Setup

Run your dev server and check:
```bash
npm run dev
```

Visit: http://localhost:3000/api/health

Should return database connection status!
