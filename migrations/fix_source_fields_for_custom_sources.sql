-- Migration: Fix source fields to support dynamic custom sources
-- This allows any source key to be used, not just hardcoded enums

-- Step 1: Change jobs.source_primary from enum to text
ALTER TABLE jobs 
  ALTER COLUMN source_primary TYPE text;

-- Step 2: Change job_sources.source from enum to text  
ALTER TABLE job_sources
  ALTER COLUMN source TYPE text;

-- Step 3: Add source_name column to jobs table for display
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS source_name text;

-- Step 4: Backfill source_name for existing jobs
UPDATE jobs 
SET source_name = CASE source_primary
  WHEN 'remoteok' THEN 'RemoteOK'
  WHEN 'remotive' THEN 'Remotive'
  WHEN 'adzuna' THEN 'Adzuna'
  WHEN 'getonboard' THEN 'GetOnBoard'
  ELSE source_primary
END
WHERE source_name IS NULL;

-- Step 5: Drop the old enum types (optional, but clean)
-- Note: This will fail if other tables still use these enums
DO $$ 
BEGIN
  DROP TYPE IF EXISTS job_source_enum CASCADE;
EXCEPTION
  WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN jobs.source_primary IS 'Source key (e.g., remoteok, custom_xyz123)';
COMMENT ON COLUMN jobs.source_name IS 'Human-readable source name for display';
COMMENT ON COLUMN job_sources.source IS 'Source key matching source_primary in jobs table';
