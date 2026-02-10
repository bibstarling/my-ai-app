# 🚀 Job Intelligence Platform - Step-by-Step Walkthrough

## Current Status Check

✅ **Environment Variables** - All set!
- Anthropic API Key ✓
- Supabase Credentials ✓
- Clerk Authentication ✓

## Step-by-Step Execution

### Step 1: Verify Your Setup (1 minute)

Run the verification script:

```bash
node scripts/verify-job-intelligence-setup.mjs
```

This will check:
- ✅ All required tables exist
- ✅ Schema is up to date
- ✅ Environment variables are configured

---

### Step 2: Apply Database Migration (2 minutes)

**IF** the verification shows missing tables or columns:

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/qtplretigutndftokplk/sql
   
2. **Copy Migration SQL**:
   - Open: `supabase/migrations/20260212000000_job_intelligence_schema_updates.sql`
   - Copy ALL contents (143 lines)
   
3. **Execute in Supabase**:
   - Paste into SQL Editor
   - Click "Run"
   - Wait for "Success" message

**What this does**:
- Adds new columns to `jobs` table (normalized_title, function, language, etc.)
- Enhances `user_job_profiles` with PRD requirements
- Creates `matches`, `user_queries`, `job_merge_log` tables
- Sets up indexes for fast queries

---

### Step 3: Start Development Server (30 seconds)

```bash
npm run dev
```

Wait for: ✓ Ready in X ms

---

### Step 4: Run First Job Ingestion (3-5 minutes)

**Option A: Via Admin Dashboard** (Recommended)

1. Open browser: http://localhost:3000/admin/jobs

2. You'll see the admin dashboard with:
   - Source health (initially empty)
   - Pipeline run button
   
3. Click **"Run Pipeline"**

4. Watch the progress (this takes 2-5 minutes):
   - RemoteOK: ~200 jobs
   - Remotive: ~300 jobs
   - Total: ~500-1000 jobs after deduplication

5. When complete, you'll see:
   ```
   Pipeline completed successfully!
   Jobs fetched: 800
   Jobs created: 650
   Jobs deduplicated: 150
   Duration: 3m 24s
   ```

**Option B: Via API** (Advanced)

```bash
# In a new terminal
curl -X POST http://localhost:3000/api/admin/jobs/pipeline \
  -H "Cookie: $(grep __session ~/.cursor/cookies | awk '{print $7}')"
```

**What's happening**:
1. **Fetch**: Workers pull jobs from RemoteOK, Remotive (Adzuna/GetOnBoard optional)
2. **Normalize**: Raw data converted to canonical format
3. **Deduplicate**: Duplicates merged (85% similarity threshold)
4. **Store**: Jobs saved to database with audit trail

**Expected Results**:
- ~500-1000 active jobs
- ~10-20% duplication rate
- All sources showing "success" status

---

### Step 5: Set Up Your Job Profile (2 minutes)

1. Navigate to: http://localhost:3000/job-profile

2. **Quick Setup** (with resume):
   ```
   a. Paste your resume text in the text area
   b. Click "Parse Resume with AI"
   c. Wait 5-10 seconds for AI to extract:
      - Skills (technical & soft)
      - Target titles
      - Seniority level
      - Languages
   d. Review and edit the extracted data
   e. Click "Save Profile"
   ```

3. **Manual Setup** (without resume):
   ```
   a. Add Target Roles:
      - "Senior Product Manager"
      - "Product Manager"
      - "Lead Product Manager"
   
   b. Add Skills:
      - "Product Strategy"
      - "User Research"
      - "Agile/Scrum"
      - "Data Analysis"
      - "AI/ML"
      (Click "Add" after each)
   
   c. Select Seniority:
      - Choose: Senior
   
   d. Add Locations:
      - "Worldwide" or
      - "US", "Brazil", "Remote"
   
   e. (Optional) Add Profile Context:
      "I want to work on AI-powered products at early-stage 
      startups. Interested in B2B SaaS and developer tools. 
      Looking for companies with strong engineering culture."
      
      ☐ Use for matching (toggle if desired)
   
   f. Click "Save Profile"
   ```

**Why this matters**:
- Profile drives personalized job ranking
- More complete = better matches
- Context is optional but improves quality

---

### Step 6: Discover Jobs! (30 seconds)

1. Navigate to: http://localhost:3000/jobs/discover

2. You'll see two discovery modes:
   - 🎯 **Personalized Discovery** (default)
   - 🔍 **Manual Search**

3. **Try Personalized Discovery**:
   ```
   a. Mode: Select "Personalized Discovery"
   b. Optional: Toggle "Use profile context" (if you added context)
   c. Click "Discover Jobs"
   d. Wait 2-3 seconds
   ```

4. **You'll see ranked results**:
   ```
   92% Match
   Senior Product Manager
   Acme AI Inc.
   
   Why this job?
   ✓ Job title closely matches your target roles (25%)
   ✓ Strong skill match: Product Strategy, AI/ML (18%)
   ✓ Seniority level matches your experience (15%)
   ✓ Posted within the last 3 days (10%)
   ✓ Job from high-quality source (5%)
   
   [Apply Now] [Save] [Generate Resume]
   ```

5. **Try Manual Search**:
   ```
   a. Mode: Select "Manual Search"
   b. Enter query: "product manager AI startup"
   c. Click "Search"
   d. See results filtered by your query
   ```

6. **Use Filters** (optional):
   ```
   Click "Show Filters"
   
   - Remote Type: ☑ remote, ☐ hybrid
   - Seniority: ☑ Senior, ☑ Mid
   - Language: ☑ English
   - Posted: Last 7 days
   
   Click "Discover Jobs" again
   ```

---

### Step 7: Save and Apply to Jobs (1 minute)

For any job that interests you:

1. **Save Job**:
   - Click "Save" button
   - Job added to tracked_jobs
   - Can view in application tracker

2. **Generate Resume**:
   - Click "Generate Resume"
   - Redirects to resume builder
   - Creates tailored resume from your portfolio
   - Optimized for this specific job

3. **Apply**:
   - Click "Apply Now"
   - Opens external application page
   - Use your generated resume!

---

## Success Indicators

### ✅ You're Ready When:

**Admin Dashboard** (http://localhost:3000/admin/jobs):
- ✅ All sources show green "success" status
- ✅ Total jobs: 500-1000
- ✅ Duplicates found: 100-200
- ✅ Errors: 0 or minimal

**Job Profile** (http://localhost:3000/job-profile):
- ✅ Skills listed (10+ recommended)
- ✅ Target titles added (2-5 recommended)
- ✅ Seniority selected
- ✅ Locations configured

**Job Discovery** (http://localhost:3000/jobs/discover):
- ✅ Jobs appear with match percentages
- ✅ "Why this job?" shows reasons
- ✅ Can filter and save jobs
- ✅ Match percentages 60-95% (good range)

---

## Troubleshooting

### Issue: No jobs after ingestion

**Check**:
```bash
# Verify in Supabase SQL Editor:
SELECT COUNT(*) FROM jobs WHERE status = 'active';
```

**If 0**:
- Check admin dashboard for errors
- Verify internet connection
- Check server console for error logs

### Issue: "Profile not found" error

**Solution**:
1. Go to http://localhost:3000/job-profile
2. Create and save profile
3. Return to discovery page

### Issue: Low match percentages (all <50%)

**Solution**:
1. Add more skills to profile
2. Broaden target titles
3. Enable profile context toggle
4. Try manual search mode

### Issue: Admin dashboard shows errors

**Common causes**:
- API rate limits (wait 1 hour, retry)
- Network issues (check connection)
- Invalid API keys (verify .env.local)

**Fix**:
1. Check specific source in dashboard
2. View detailed error in console
3. Fix issue (e.g., add API key)
4. Run pipeline again

---

## What's Next?

### Immediate:
- [ ] Browse and save interesting jobs
- [ ] Generate tailored resumes
- [ ] Track application progress

### Optional Enhancements:
- [ ] Add ADZUNA_API_KEY for more jobs
- [ ] Add GETONBOARD_API_KEY for LATAM jobs
- [ ] Schedule daily ingestion (cron job)
- [ ] Customize ranking weights

### Advanced:
- [ ] Add semantic search (embeddings)
- [ ] Set up job alerts
- [ ] Build email digests
- [ ] Create Chrome extension

---

## Quick Reference

### URLs
- **Admin Dashboard**: http://localhost:3000/admin/jobs
- **Job Profile**: http://localhost:3000/job-profile
- **Discover Jobs**: http://localhost:3000/jobs/discover
- **My Applications**: http://localhost:3000/my-applications (existing)

### Commands
```bash
# Verify setup
node scripts/verify-job-intelligence-setup.mjs

# Start dev server
npm run dev

# Run ingestion (via curl)
curl -X POST http://localhost:3000/api/admin/jobs/pipeline

# Check database (in Supabase SQL Editor)
SELECT COUNT(*) FROM jobs WHERE status = 'active';
SELECT * FROM job_sync_metrics;
SELECT * FROM matches LIMIT 10;
```

### Files
- **Migration**: `supabase/migrations/20260212000000_job_intelligence_schema_updates.sql`
- **Documentation**: `docs/JOB_INTELLIGENCE_PLATFORM.md`
- **Quick Start**: `docs/QUICK_START_JOB_INTELLIGENCE.md`

---

## Completion Checklist

- [ ] Migration applied (tables created)
- [ ] Ingestion pipeline run (jobs fetched)
- [ ] Job profile created (skills, titles added)
- [ ] Jobs discovered (match percentages shown)
- [ ] Job saved (tracked_jobs entry)
- [ ] Resume generated (integration tested)

**When all checked**: 🎉 You're fully set up!

---

## Support

Having issues? Check:
1. This walkthrough for troubleshooting
2. `docs/JOB_INTELLIGENCE_PLATFORM.md` for technical details
3. Admin dashboard for real-time status
4. Server console for detailed logs

Happy job hunting! 🚀
