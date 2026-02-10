-- Job Intelligence Platform Schema Updates
-- Updates existing schema to match PRD requirements

-- Add missing columns to jobs table for PRD compliance
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS normalized_title TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS function TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS allowed_countries TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locations TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS timezone_constraints TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_min NUMERIC;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_max NUMERIC;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_currency TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_period TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_url TEXT;

-- Update existing columns for better alignment
UPDATE jobs 
SET normalized_title = title 
WHERE normalized_title IS NULL;

UPDATE jobs
SET compensation_min = salary_min,
    compensation_max = salary_max,
    compensation_currency = salary_currency
WHERE compensation_min IS NULL;

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_jobs_language ON jobs (language);
CREATE INDEX IF NOT EXISTS idx_jobs_normalized_title ON jobs (normalized_title);
CREATE INDEX IF NOT EXISTS idx_jobs_function ON jobs (function);

-- Enhanced user_job_profiles to match PRD UserProfile
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS resume_text TEXT;
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS target_titles TEXT[] DEFAULT '{}';
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS seniority TEXT;
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS locations_allowed TEXT[] DEFAULT '{}';
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS locations_excluded TEXT[] DEFAULT '{}';
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS salary_min NUMERIC;
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS salary_max NUMERIC;
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'USD';
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS profile_context_text TEXT;
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS use_profile_context_for_matching BOOLEAN DEFAULT false;
ALTER TABLE user_job_profiles ADD COLUMN IF NOT EXISTS work_authorization_constraints TEXT[] DEFAULT '{}';

-- Migrate existing role_keywords to target_titles
UPDATE user_job_profiles 
SET target_titles = role_keywords 
WHERE target_titles = '{}' AND role_keywords IS NOT NULL AND array_length(role_keywords, 1) > 0;

-- Migrate existing preferred_regions to locations_allowed
UPDATE user_job_profiles 
SET locations_allowed = preferred_regions 
WHERE locations_allowed = '{}' AND preferred_regions IS NOT NULL AND array_length(preferred_regions, 1) > 0;

-- Create UserQuery table for saved searches
CREATE TABLE IF NOT EXISTS user_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- clerk_id
  query_text TEXT NOT NULL,
  use_profile_context BOOLEAN DEFAULT false,
  use_profile_basics BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  CONSTRAINT fk_user_queries_clerk_id FOREIGN KEY (user_id) REFERENCES user_job_profiles(clerk_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_queries_user_id ON user_queries (user_id);
CREATE INDEX IF NOT EXISTS idx_user_queries_last_run_at ON user_queries (last_run_at);

-- Enable RLS on user_queries
ALTER TABLE user_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own queries" ON user_queries FOR ALL USING (true);

-- Create Match table for job rankings and explanations
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- clerk_id
  job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  reasons JSONB DEFAULT '[]'::jsonb,  -- Array of explanation objects
  eligibility_passed BOOLEAN DEFAULT true,
  inputs_used JSONB DEFAULT '{}'::jsonb,  -- Track what was used (profile, context, query)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_matches_clerk_id FOREIGN KEY (user_id) REFERENCES user_job_profiles(clerk_id) ON DELETE CASCADE,
  UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches (user_id);
CREATE INDEX IF NOT EXISTS idx_matches_job_id ON matches (job_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches (score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user_score ON matches (user_id, score DESC);

-- Enable RLS on matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Service role can manage matches" ON matches FOR ALL USING (true);

-- Function to update matches updated_at
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matches_updated_at_trigger
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_matches_updated_at();

-- Add source tracking for deduplication audit
CREATE TABLE IF NOT EXISTS job_merge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  merged_from_source job_source_enum NOT NULL,
  merged_from_source_id TEXT NOT NULL,
  similarity_score NUMERIC,  -- How similar the jobs were (0-1)
  merge_reason TEXT,  -- Why they were merged (title+company match, etc.)
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_job_merge_log_canonical ON job_merge_log (canonical_job_id);
CREATE INDEX IF NOT EXISTS idx_job_merge_log_merged_at ON job_merge_log (merged_at DESC);

-- Enable RLS (admin only)
ALTER TABLE job_merge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage merge log" ON job_merge_log FOR ALL USING (true);

COMMENT ON TABLE user_queries IS 'Saved user search queries with profile context toggle';
COMMENT ON TABLE matches IS 'Job match scores and explainability for users';
COMMENT ON TABLE job_merge_log IS 'Audit log for job deduplication merges';
COMMENT ON COLUMN user_job_profiles.use_profile_context_for_matching IS 'Toggle to use profile_context_text in ranking';
