-- Create application_questions table for storing job application questions and AI-generated answers
CREATE TABLE IF NOT EXISTS application_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_job_id UUID NOT NULL REFERENCES tracked_jobs(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  
  -- Question and answer content
  question_text TEXT NOT NULL,
  answer_text TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  
  -- For ordering questions
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_application_questions_job_id ON application_questions(tracked_job_id);
CREATE INDEX IF NOT EXISTS idx_application_questions_clerk_id ON application_questions(clerk_id);
CREATE INDEX IF NOT EXISTS idx_application_questions_job_order ON application_questions(tracked_job_id, order_index);

-- Enable RLS
ALTER TABLE application_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can only access their own questions
CREATE POLICY "Users can manage their own application questions"
  ON application_questions FOR ALL
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_application_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_application_questions_updated_at_trigger
  BEFORE UPDATE ON application_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_application_questions_updated_at();
