-- Add ATS analysis table for tracking resume optimization scores
CREATE TABLE IF NOT EXISTS resume_ats_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_company TEXT NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  keyword_coverage INTEGER NOT NULL CHECK (keyword_coverage >= 0 AND keyword_coverage <= 100),
  structure_score INTEGER NOT NULL CHECK (structure_score >= 0 AND structure_score <= 100),
  semantic_alignment INTEGER NOT NULL CHECK (semantic_alignment >= 0 AND semantic_alignment <= 100),
  recommendations TEXT[] DEFAULT '{}',
  missing_keywords TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for efficient queries
CREATE INDEX idx_resume_ats_analyses_resume_id ON resume_ats_analyses(resume_id);
CREATE INDEX idx_resume_ats_analyses_clerk_id ON resume_ats_analyses(clerk_id);
CREATE INDEX idx_resume_ats_analyses_created_at ON resume_ats_analyses(created_at DESC);
CREATE INDEX idx_resume_ats_analyses_overall_score ON resume_ats_analyses(overall_score DESC);

-- Add RLS policies
ALTER TABLE resume_ats_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own ATS analyses
CREATE POLICY "Users can view own ATS analyses"
  ON resume_ats_analyses
  FOR SELECT
  USING (clerk_id = auth.jwt() ->> 'sub');

-- Users can insert their own ATS analyses
CREATE POLICY "Users can insert own ATS analyses"
  ON resume_ats_analyses
  FOR INSERT
  WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- Users can update their own ATS analyses
CREATE POLICY "Users can update own ATS analyses"
  ON resume_ats_analyses
  FOR UPDATE
  USING (clerk_id = auth.jwt() ->> 'sub');

-- Users can delete their own ATS analyses
CREATE POLICY "Users can delete own ATS analyses"
  ON resume_ats_analyses
  FOR DELETE
  USING (clerk_id = auth.jwt() ->> 'sub');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_resume_ats_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resume_ats_analyses_updated_at
  BEFORE UPDATE ON resume_ats_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_ats_analyses_updated_at();

-- Add comment
COMMENT ON TABLE resume_ats_analyses IS 'Stores ATS (Applicant Tracking System) compatibility analyses for resumes';

-- Add ATS analysis table for cover letters
CREATE TABLE IF NOT EXISTS cover_letter_ats_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cover_letter_id UUID NOT NULL REFERENCES cover_letters(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_company TEXT NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  keyword_coverage INTEGER NOT NULL CHECK (keyword_coverage >= 0 AND keyword_coverage <= 100),
  semantic_alignment INTEGER NOT NULL CHECK (semantic_alignment >= 0 AND semantic_alignment <= 100),
  recommendations TEXT[] DEFAULT '{}',
  missing_keywords TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add indexes for efficient queries
CREATE INDEX idx_cover_letter_ats_analyses_cover_letter_id ON cover_letter_ats_analyses(cover_letter_id);
CREATE INDEX idx_cover_letter_ats_analyses_clerk_id ON cover_letter_ats_analyses(clerk_id);
CREATE INDEX idx_cover_letter_ats_analyses_created_at ON cover_letter_ats_analyses(created_at DESC);
CREATE INDEX idx_cover_letter_ats_analyses_overall_score ON cover_letter_ats_analyses(overall_score DESC);

-- Add RLS policies
ALTER TABLE cover_letter_ats_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own ATS analyses
CREATE POLICY "Users can view own cover letter ATS analyses"
  ON cover_letter_ats_analyses
  FOR SELECT
  USING (clerk_id = auth.jwt() ->> 'sub');

-- Users can insert their own ATS analyses
CREATE POLICY "Users can insert own cover letter ATS analyses"
  ON cover_letter_ats_analyses
  FOR INSERT
  WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- Users can update their own ATS analyses
CREATE POLICY "Users can update own cover letter ATS analyses"
  ON cover_letter_ats_analyses
  FOR UPDATE
  USING (clerk_id = auth.jwt() ->> 'sub');

-- Users can delete their own ATS analyses
CREATE POLICY "Users can delete own cover letter ATS analyses"
  ON cover_letter_ats_analyses
  FOR DELETE
  USING (clerk_id = auth.jwt() ->> 'sub');

-- Add trigger for updated_at
CREATE TRIGGER cover_letter_ats_analyses_updated_at
  BEFORE UPDATE ON cover_letter_ats_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_ats_analyses_updated_at();

-- Add comment
COMMENT ON TABLE cover_letter_ats_analyses IS 'Stores ATS (Applicant Tracking System) compatibility analyses for cover letters';
