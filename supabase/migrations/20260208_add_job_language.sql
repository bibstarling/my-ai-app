-- Add language detection to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS detected_language TEXT DEFAULT 'en' CHECK (detected_language IN ('en', 'pt-BR', 'unknown'));

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_jobs_detected_language ON jobs(detected_language);

-- Comment
COMMENT ON COLUMN jobs.detected_language IS 'Auto-detected language from job description (en, pt-BR, or unknown)';

-- Update existing jobs to 'unknown' if they don't have a language set
UPDATE jobs 
SET detected_language = 'unknown' 
WHERE detected_language IS NULL;
