-- ============================================================================
-- COMBINED MIGRATIONS FOR MY-AI-APP
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Job Ingestion Schema
-- ============================================================================

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

-- User job profile: skills and preferences for matching
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

-- RLS policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sync_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_job_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow service role all jobs" ON jobs FOR ALL USING (true);
CREATE POLICY "Allow service role job_sources" ON job_sources FOR ALL USING (true);
CREATE POLICY "Allow service role sync_metrics" ON job_sync_metrics FOR ALL USING (true);
CREATE POLICY "Users read own profile" ON user_job_profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON user_job_profiles FOR ALL USING (true);

COMMENT ON TABLE jobs IS 'Canonical job records from RemoteOK, Remotive, Adzuna; deduplicated and enriched';
COMMENT ON TABLE job_sources IS 'Raw API payloads and mapping to canonical job';
COMMENT ON TABLE job_sync_metrics IS 'Last sync time and counters per source for /health and observability';
COMMENT ON TABLE user_job_profiles IS 'Skills and preferences for /matches ranking';

-- ============================================================================
-- MIGRATION 2: Resume Builder Schema
-- ============================================================================

-- Enums
CREATE TYPE resume_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE section_type AS ENUM ('summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'custom');

-- Main resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status resume_status NOT NULL DEFAULT 'draft',
  
  -- Contact info
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_clerk_id ON resumes (clerk_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes (status);

-- Resume sections
CREATE TABLE IF NOT EXISTS resume_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
  section_type section_type NOT NULL,
  title TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_sections_resume_id ON resume_sections (resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_sections_type ON resume_sections (section_type);
CREATE INDEX IF NOT EXISTS idx_resume_sections_sort_order ON resume_sections (resume_id, sort_order);

-- Job-specific resume adaptations
CREATE TABLE IF NOT EXISTS resume_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs (id) ON DELETE SET NULL,
  clerk_id TEXT NOT NULL,
  
  -- Job context
  job_title TEXT NOT NULL,
  job_company TEXT NOT NULL,
  job_description TEXT,
  
  -- Adapted content
  adapted_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- AI analysis
  match_score INT,
  suggested_keywords TEXT[] DEFAULT '{}',
  gaps TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  ai_recommendations TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_adaptations_resume_id ON resume_adaptations (resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_adaptations_job_id ON resume_adaptations (job_id);
CREATE INDEX IF NOT EXISTS idx_resume_adaptations_clerk_id ON resume_adaptations (clerk_id);

-- RLS policies
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_adaptations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own resumes" ON resumes FOR ALL USING (true);
CREATE POLICY "Users manage own resume sections" ON resume_sections FOR ALL 
  USING (EXISTS (SELECT 1 FROM resumes WHERE resumes.id = resume_sections.resume_id));
CREATE POLICY "Users manage own adaptations" ON resume_adaptations FOR ALL USING (true);

COMMENT ON TABLE resumes IS 'User resumes with versioning and contact info';
COMMENT ON TABLE resume_sections IS 'Flexible resume sections (experience, education, skills, etc.)';
COMMENT ON TABLE resume_adaptations IS 'Job-specific tailored resume versions with AI recommendations';

-- ============================================================================
-- MIGRATION 3: Cover Letter Schema
-- ============================================================================

-- Enums
CREATE TYPE cover_letter_status AS ENUM ('draft', 'final', 'archived');

-- Cover letters table
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  job_id UUID REFERENCES jobs (id) ON DELETE SET NULL,
  resume_id UUID REFERENCES resumes (id) ON DELETE SET NULL,
  
  -- Job context
  job_title TEXT NOT NULL,
  job_company TEXT NOT NULL,
  job_description TEXT,
  
  -- Letter content
  recipient_name TEXT,
  recipient_title TEXT,
  company_address TEXT,
  
  opening_paragraph TEXT NOT NULL,
  body_paragraphs TEXT[] NOT NULL DEFAULT '{}',
  closing_paragraph TEXT NOT NULL,
  
  -- Metadata
  status cover_letter_status NOT NULL DEFAULT 'draft',
  tone TEXT,
  
  -- AI context
  selected_experiences TEXT[] DEFAULT '{}',
  selected_projects TEXT[] DEFAULT '{}',
  key_points TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_clerk_id ON cover_letters (clerk_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_id ON cover_letters (job_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_resume_id ON cover_letters (resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_status ON cover_letters (status);

-- RLS policies
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cover letters" ON cover_letters FOR ALL USING (true);

COMMENT ON TABLE cover_letters IS 'AI-generated cover letters tailored to specific job postings';
COMMENT ON COLUMN cover_letters.body_paragraphs IS 'Array of 2-3 body paragraphs, each highlighting different qualifications';
COMMENT ON COLUMN cover_letters.selected_experiences IS 'Experience titles that were highlighted in the letter';
COMMENT ON COLUMN cover_letters.selected_projects IS 'Project titles that were mentioned in the letter';

-- ============================================================================
-- MIGRATION 4: Tracked Jobs
-- ============================================================================

-- Create tracked_jobs table
CREATE TABLE IF NOT EXISTS tracked_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  
  -- Job information
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT,
  salary TEXT,
  posted_date TEXT,
  description TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  
  -- Tracking status
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'rejected', 'archived')),
  
  -- Tailored content
  tailored_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  tailored_cover_letter_id UUID REFERENCES cover_letters(id) ON DELETE SET NULL,
  
  -- Notes and tracking
  notes TEXT,
  applied_date TIMESTAMP WITH TIME ZONE,
  interview_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tracked_jobs_clerk_id ON tracked_jobs(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tracked_jobs_status ON tracked_jobs(status);
CREATE INDEX IF NOT EXISTS idx_tracked_jobs_clerk_status ON tracked_jobs(clerk_id, status);

-- Enable RLS
ALTER TABLE tracked_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own tracked jobs"
  ON tracked_jobs FOR ALL
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tracked_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tracked_jobs_updated_at_trigger
  BEFORE UPDATE ON tracked_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_tracked_jobs_updated_at();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- You should now have all the tables needed for the application:
-- ✓ jobs, job_sources, job_sync_metrics, user_job_profiles
-- ✓ resumes, resume_sections, resume_adaptations  
-- ✓ cover_letters
-- ✓ tracked_jobs
-- ============================================================================
