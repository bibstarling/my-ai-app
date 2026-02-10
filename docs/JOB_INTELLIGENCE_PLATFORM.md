# Job Intelligence Platform

## Overview

The Job Intelligence Platform is a comprehensive system for discovering, ranking, and applying to remote job opportunities worldwide and in LATAM. It's built on the principles outlined in the Product Requirements Document (PRD) and solves three core problems:

1. **Fragmentation**: Aggregates jobs from multiple sources into one place
2. **Noise and Duplication**: Intelligent deduplication creates a single source of truth
3. **Low-Signal Matching**: Ranks jobs based on eligibility and fit, not just keywords

## Architecture

### Core Services

#### 1. Job Ingestion
- **Location**: `lib/jobs-ingestion/`
- **Components**:
  - `base-worker.ts`: Base class for all ingestion workers
  - `remoteok-worker.ts`: RemoteOK API integration
  - `remotive-worker.ts`: Remotive API integration
  - `adzuna-worker.ts`: Adzuna API integration
  - `getonboard-worker.ts`: GetOnBoard API integration (LATAM focus)
  - `ingestion-orchestrator.ts`: Manages all workers and sync metrics

**How it works**:
- Workers fetch jobs from external APIs on a schedule
- Raw payloads are stored verbatim for auditability
- Sync metrics track health and errors for observability

#### 2. Normalization Service
- **Location**: `lib/jobs-ingestion/normalization-service.ts`
- **Purpose**: Converts raw API responses into canonical job format

**Features**:
- Deterministic transformations (testable and reproducible)
- Title normalization (removes location, company suffixes)
- Seniority detection (Junior, Mid, Senior, Executive)
- Function classification (Engineering, Product, Design, etc.)
- Skill extraction from tags and descriptions
- Remote type and location parsing
- Salary parsing and normalization
- Language detection (English, Portuguese, Spanish)

#### 3. Deduplication Service
- **Location**: `lib/jobs-ingestion/deduplication-service.ts`
- **Purpose**: Merges duplicate postings into single canonical jobs

**Strategy**:
- **Fingerprinting**: Generates dedupe keys from company + title hash
- **Exact Match**: Fast lookup by dedupe key
- **Fuzzy Match**: Jaccard similarity on company + title + description
- **Threshold**: 85% similarity to merge
- **Audit Trail**: All merges logged in `job_merge_log` table

**Why it matters**: The same job often appears on multiple boards with slight variations. This service ensures users see each opportunity once.

#### 4. Ranking Service
- **Location**: `lib/jobs-ingestion/ranking-service.ts`
- **Purpose**: Ranks jobs with explainable scoring

**Eligibility Gates** (hard filters):
- Remote type (remote/hybrid/onsite)
- Allowed regions/countries
- Work authorization
- Language requirements

**Scoring Factors** (configurable weights):
- Title match (25%): How well job title matches user's target roles
- Skill overlap (20%): Intersection of job skills and user skills
- Seniority alignment (15%): Difference in seniority levels
- Location fit (10%): Geographic compatibility
- Freshness (10%): How recently the job was posted
- Source quality (5%): Curated sources rank higher
- Query relevance (10%): Keyword match for manual searches
- Profile context (5%): Career goals and preferences

**Explainability**: Each match includes top 5 reasons with human-readable descriptions like "Strong skill match: React, TypeScript, Node.js"

#### 5. Pipeline Service
- **Location**: `lib/jobs-ingestion/pipeline-service.ts`
- **Purpose**: Orchestrates the complete flow

**Pipeline Flow**:
```
Fetch → Normalize → Deduplicate → Store → Rank
```

Runs automatically or on-demand via admin dashboard.

### Database Schema

#### Core Tables

**jobs** (canonical source of truth):
- Normalized job data from all sources
- Dedupe key for fast duplicate detection
- Status tracking (active, expired, removed)
- Full-text searchable

**job_sources** (provenance):
- Maps canonical jobs to source postings
- Stores raw API payloads
- Enables source attribution

**user_job_profiles**:
- Resume text and extracted skills
- Target titles and seniority
- Location preferences (allowed/excluded)
- Salary expectations
- Profile context (optional career goals)
- `use_profile_context_for_matching` toggle

**matches**:
- Pre-computed match scores per user/job pair
- Top 5 match reasons for explainability
- Inputs used (profile, context, query)
- Eligibility pass/fail status

**job_sync_metrics**:
- Last sync time and status per source
- Jobs fetched, upserted, duplicated
- Error counts for monitoring

**job_merge_log**:
- Audit trail of all deduplication merges
- Similarity scores and merge reasons
- Created by (system or admin)

### User Flows

#### 1. Profile Setup
**Route**: `/job-profile`

Steps:
1. User pastes resume text
2. AI extracts skills, titles, seniority
3. User reviews and edits
4. User sets location preferences, languages
5. (Optional) Add profile context with career goals
6. Save profile

**Backend**: `POST /api/job-profile` with resume parsing via Claude

#### 2. Job Discovery
**Route**: `/jobs/discover`

**Modes**:

**A) Personalized Discovery**:
- Uses user's profile for ranking
- Optional: Toggle profile context for deeper matching
- Returns jobs sorted by match percentage
- Shows "Why this job?" explanations

**B) Manual Query**:
- User enters free-text search
- Profile used for eligibility only
- Query relevance drives ranking
- Reproducible results

**Filters** (both modes):
- Remote type (remote/hybrid/onsite)
- Seniority (Junior/Mid/Senior/Executive)
- Language (English/Portuguese/Spanish)
- Posted date (24h, 7d, 30d, any)

**Backend**: `POST /api/jobs/discover`

#### 3. Application Workflow
From discovery, users can:
1. **Save job**: Track for later (`POST /api/jobs/[jobId]/track`)
2. **Generate resume**: Creates tailored resume from portfolio
3. **Generate cover letter**: AI-written letter highlighting relevant experience
4. **Track application**: Kanban board (Saved → Applied → Interview → Offer)

**Integration**: Discovery integrates with existing resume/cover letter system. Clicking "Generate Resume" redirects to `/resume-builder?jobId=...`

### API Endpoints

#### Public/User APIs
- `POST /api/jobs/discover` - Discover jobs (personalized or query)
- `GET /api/job-profile` - Get user's job profile
- `POST /api/job-profile` - Create/update profile
- `POST /api/job-profile/parse-resume` - AI resume parsing
- `PATCH /api/job-profile` - Partial update (e.g., toggle context)
- `POST /api/jobs/[jobId]/track` - Save job to tracked_jobs

#### Admin APIs
- `POST /api/admin/jobs/pipeline` - Run ingestion pipeline
- `GET /api/admin/jobs/metrics` - Get sync metrics
- `GET /api/jobs/ingestion` - List canonical jobs (with filters)

### Admin Dashboard
**Route**: `/admin/jobs`

Features:
- **Stats Overview**: Total jobs, active sources, duplicates found
- **Pipeline Control**: Run ingestion on-demand
- **Source Health Table**: Last sync time, status, errors per source
- **Last Run Stats**: Jobs fetched/created/deduplicated, duration

**Use Case**: Monitor system health, trigger manual syncs, debug source failures

## Environment Variables

Required for full functionality:

```bash
# Adzuna (optional, enhances coverage)
ADZUNA_API_KEY=your_key
ADZUNA_APP_ID=your_app_id

# GetOnBoard (optional, LATAM jobs)
GETONBOARD_API_KEY=your_key

# AI for resume parsing
ANTHROPIC_API_KEY=your_key
```

**Note**: RemoteOK and Remotive APIs are public and don't require keys.

## Running the System

### 1. Apply Database Migrations

Run in Supabase SQL Editor:

```bash
supabase/migrations/20260212000000_job_intelligence_schema_updates.sql
```

### 2. Run Ingestion Pipeline

**Option A: Admin Dashboard**
1. Navigate to `/admin/jobs`
2. Click "Run Pipeline"
3. Wait for completion (2-5 minutes)

**Option B: API**
```bash
curl -X POST http://localhost:3000/api/admin/jobs/pipeline \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### 3. Set Up User Profile

1. Go to `/job-profile`
2. Paste resume or manually enter data
3. Click "Parse Resume with AI"
4. Review and save

### 4. Discover Jobs

1. Go to `/jobs/discover`
2. Choose mode:
   - **Personalized**: Toggle profile context if desired
   - **Manual**: Enter search query
3. Apply filters (optional)
4. Click "Discover Jobs" or "Search"

### 5. Apply to Jobs

From results:
- Click "Save" to track the job
- Click "Generate Resume" to create tailored resume
- Click "Apply Now" to open external application

## Technical Decisions

### Why This Architecture?

**Modular Services**:
- Each service (ingestion, normalization, deduplication, ranking) is isolated
- Easy to test, debug, and swap implementations
- Can scale independently if needed

**Deterministic Normalization**:
- Same input → same output (reproducible)
- No reliance on external APIs during normalization
- Fast and testable

**Fingerprint + Fuzzy Deduplication**:
- Fast exact match via hash
- Fallback to similarity for edge cases
- Audit log for all merges

**Explainable Ranking**:
- Not a black box: users see why jobs match
- Builds trust and helps refine profile
- Configurable weights for experimentation

### Why Not Use X?

**Vector embeddings for ranking?**
- Adds complexity and latency
- Hard to explain to users
- Current keyword/rule-based approach works well
- Can add later as optional boost

**Real-time ingestion?**
- Jobs don't change that fast
- Batch processing is simpler and cheaper
- Daily/on-demand sync is sufficient

**ElasticSearch/Meilisearch?**
- PostgreSQL full-text search is "good enough" for V1
- Can add later if scale requires it
- Reduces infrastructure complexity

## Success Metrics

From PRD:

**User Value**:
- ≥40% of viewed jobs are saved or opened
- ≥25% of saved jobs progress to "Applied"
- Reduced time wasted per application

**System Quality**:
- ≥90% duplicate postings merged correctly
- ≥95% correct classification of remote type
- ≥99% ingestion uptime

## Future Enhancements

**Phase 2** (from PRD):
- Resume and cover letter generation (✅ already implemented)
- Application tracking (✅ already implemented)

**Phase 3** (planned):
- Semantic reranking with embeddings
- Job alerts and weekly digests
- Interview coaching and prep

## Troubleshooting

### Jobs not appearing after ingestion?

1. Check admin dashboard for errors
2. Verify source API keys in environment
3. Check `job_sync_metrics` table for last sync status
4. Look at server logs for detailed errors

### Low match percentages?

1. Ensure user profile is complete (skills, titles, seniority)
2. Check that target titles align with available jobs
3. Enable profile context toggle for broader matching
4. Try manual query mode with specific keywords

### Duplicates not being merged?

1. Check `job_merge_log` table for merge attempts
2. Verify dedupe keys are being generated correctly
3. Adjust similarity threshold in `deduplication-service.ts`
4. Check for edge cases (e.g., very similar company names)

### Source failing to sync?

1. Verify API key and credentials
2. Check rate limits (especially Adzuna)
3. Test API endpoint directly (curl)
4. Check for API schema changes
5. Look at `job_sync_metrics.errors_count`

## Contributing

When adding a new job source:

1. Create `lib/jobs-ingestion/[source]-worker.ts` extending `BaseJobWorker`
2. Implement `fetchJobs()` to return `RawJobPosting[]`
3. Add source to `JobSourceEnum` in `lib/types/job-intelligence.ts`
4. Add normalization logic in `normalization-service.ts`
5. Register worker in `ingestion-orchestrator.ts`
6. Update database enum: `ALTER TYPE job_source_enum ADD VALUE '[source]';`

## License

This code is part of the Applause platform and follows the main project license.
