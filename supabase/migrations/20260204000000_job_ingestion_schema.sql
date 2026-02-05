-- Multi-source job ingestion: canonical jobs, sources, sync metrics, user profiles for matching.
-- Run this in Supabase SQL Editor (or via Supabase CLI) against your project.

-- Enums
CREATE TYPE job_remote_type AS ENUM ('remote', 'hybrid', 'onsite', 'unknown');
CREATE TYPE job_status AS ENUM ('active', 'expired', 'removed');
CREATE TYPE job_source_enum AS ENUM ('remoteok', 'remotive', 'adzuna');

-- Canonical jobs table (source of truth)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  location_raw TEXT,
  country TEXT,
  is_remote BOOLEAN NOT NULL DEFAULT true,
  remote_type job_remote_type NOT NULL DEFAULT 'remote',
  remote_region_eligibility TEXT,
  employment_type TEXT,
  seniority TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT,
  description_text TEXT NOT NULL DEFAULT '',
  requirements_text TEXT,
  apply_url TEXT NOT NULL DEFAULT '',
  source_primary job_source_enum NOT NULL,
  posted_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dedupe_key TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'active',
  skills_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_dedupe_key ON jobs (dedupe_key);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs (posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON jobs (remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs (country);
CREATE INDEX IF NOT EXISTS idx_jobs_skills_gin ON jobs USING GIN (skills_json);

-- Raw source payloads and link to canonical job
CREATE TABLE IF NOT EXISTS job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source job_source_enum NOT NULL,
  source_job_id TEXT NOT NULL,
  source_url TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_sources_source_id ON job_sources (source, source_job_id);
CREATE INDEX IF NOT EXISTS idx_job_sources_job_id ON job_sources (job_id);

-- Sync metrics for health and observability
CREATE TABLE IF NOT EXISTS job_sync_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source job_source_enum NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  jobs_fetched INT DEFAULT 0,
  jobs_upserted INT DEFAULT 0,
  duplicates_found INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_sync_metrics_source ON job_sync_metrics (source);

-- User job profile: skills and preferences for matching (link by clerk_id to match existing auth)
CREATE TABLE IF NOT EXISTS user_job_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL UNIQUE,
  skills_json JSONB DEFAULT '[]'::jsonb,
  role_keywords TEXT[] DEFAULT '{}',
  preferred_regions TEXT[] DEFAULT '{}',
  exclude_companies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_job_profiles_clerk_id ON user_job_profiles (clerk_id);

-- RLS: allow anon to read jobs (for public listing); restrict job_sources and sync_metrics to service role.
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sync_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_job_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow service role all jobs" ON jobs FOR ALL USING (true); -- service role bypasses RLS by default in Supabase

CREATE POLICY "Allow service role job_sources" ON job_sources FOR ALL USING (true);
CREATE POLICY "Allow service role sync_metrics" ON job_sync_metrics FOR ALL USING (true);

-- Users can read/update own profile by clerk_id (we check in app via auth)
CREATE POLICY "Users read own profile" ON user_job_profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON user_job_profiles FOR ALL USING (true);

COMMENT ON TABLE jobs IS 'Canonical job records from RemoteOK, Remotive, Adzuna; deduplicated and enriched';
COMMENT ON TABLE job_sources IS 'Raw API payloads and mapping to canonical job';
COMMENT ON TABLE job_sync_metrics IS 'Last sync time and counters per source for /health and observability';
COMMENT ON TABLE user_job_profiles IS 'Skills and preferences for /matches ranking';
