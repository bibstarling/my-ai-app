-- Create tracked_jobs table for job tracking with kanban status
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tracked_jobs_clerk_id ON tracked_jobs(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tracked_jobs_status ON tracked_jobs(status);
CREATE INDEX IF NOT EXISTS idx_tracked_jobs_clerk_status ON tracked_jobs(clerk_id, status);

-- Enable RLS
ALTER TABLE tracked_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for Clerk auth - you'll match clerk_id in your app layer)
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
