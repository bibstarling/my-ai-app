-- Add match_percentage field to tracked_jobs table
ALTER TABLE tracked_jobs 
ADD COLUMN IF NOT EXISTS match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100);

-- Add index for filtering/sorting by match percentage
CREATE INDEX IF NOT EXISTS idx_tracked_jobs_match_percentage ON tracked_jobs(match_percentage DESC);

-- Add comment for documentation
COMMENT ON COLUMN tracked_jobs.match_percentage IS 'AI-calculated match percentage (0-100) comparing tailored resume/cover letter to job description';
