-- Cover letter schema: job-specific cover letters with AI generation
-- Run this in Supabase SQL Editor (or via Supabase CLI) against your project.

-- Enums
CREATE TYPE cover_letter_status AS ENUM ('draft', 'final', 'archived');

-- Cover letters table
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  job_id UUID REFERENCES jobs (id) ON DELETE SET NULL,
  resume_id UUID REFERENCES resumes (id) ON DELETE SET NULL,
  
  -- Job context (snapshot)
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
  tone TEXT, -- e.g., 'professional', 'enthusiastic', 'formal'
  
  -- AI context
  selected_experiences TEXT[] DEFAULT '{}', -- Which experiences were highlighted
  selected_projects TEXT[] DEFAULT '{}',    -- Which projects were mentioned
  key_points TEXT[] DEFAULT '{}',           -- Main selling points
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_clerk_id ON cover_letters (clerk_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_job_id ON cover_letters (job_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_resume_id ON cover_letters (resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_status ON cover_letters (status);

-- RLS policies
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cover letters
CREATE POLICY "Users manage own cover letters" ON cover_letters FOR ALL USING (true);

-- Comments
COMMENT ON TABLE cover_letters IS 'AI-generated cover letters tailored to specific job postings';
COMMENT ON COLUMN cover_letters.body_paragraphs IS 'Array of 2-3 body paragraphs, each highlighting different qualifications';
COMMENT ON COLUMN cover_letters.selected_experiences IS 'Experience titles that were highlighted in the letter';
COMMENT ON COLUMN cover_letters.selected_projects IS 'Project titles that were mentioned in the letter';
