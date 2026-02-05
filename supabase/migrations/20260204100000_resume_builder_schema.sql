-- Resume builder: user resumes, sections, and job-specific adaptations
-- Run this in Supabase SQL Editor (or via Supabase CLI) against your project.

-- Enums
CREATE TYPE resume_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE section_type AS ENUM ('summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'custom');

-- Main resumes table (versioned resumes per user)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  title TEXT NOT NULL, -- e.g., "Product Manager Resume", "Software Engineer Resume"
  is_primary BOOLEAN NOT NULL DEFAULT false, -- primary/default resume
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

-- Resume sections (flexible structure for different section types)
CREATE TABLE IF NOT EXISTS resume_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
  section_type section_type NOT NULL,
  title TEXT, -- custom title for the section
  sort_order INT NOT NULL DEFAULT 0,
  
  -- Flexible JSON content based on section type
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- summary: { "text": "..." }
  -- experience: { "position": "...", "company": "...", "startDate": "...", "endDate": "...", "bullets": [...] }
  -- education: { "degree": "...", "institution": "...", "year": "...", "description": "..." }
  -- skills: { "category": "...", "items": [...] }
  -- projects: { "name": "...", "description": "...", "url": "...", "bullets": [...] }
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_sections_resume_id ON resume_sections (resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_sections_type ON resume_sections (section_type);
CREATE INDEX IF NOT EXISTS idx_resume_sections_sort_order ON resume_sections (resume_id, sort_order);

-- Job-specific resume adaptations (AI-tailored versions)
CREATE TABLE IF NOT EXISTS resume_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes (id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs (id) ON DELETE SET NULL, -- null if job was deleted
  clerk_id TEXT NOT NULL,
  
  -- Job context (snapshot in case job gets deleted)
  job_title TEXT NOT NULL,
  job_company TEXT NOT NULL,
  job_description TEXT,
  
  -- Adapted content (stores modified sections as JSONB)
  adapted_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of sections with same structure as resume_sections but modified for this job
  
  -- AI analysis
  match_score INT, -- 0-100 score
  suggested_keywords TEXT[] DEFAULT '{}',
  gaps TEXT[] DEFAULT '{}', -- skills/experience gaps
  strengths TEXT[] DEFAULT '{}',
  ai_recommendations TEXT, -- detailed recommendations
  
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

-- Users can manage their own resumes
CREATE POLICY "Users manage own resumes" ON resumes FOR ALL USING (true);
CREATE POLICY "Users manage own resume sections" ON resume_sections FOR ALL 
  USING (EXISTS (SELECT 1 FROM resumes WHERE resumes.id = resume_sections.resume_id));
CREATE POLICY "Users manage own adaptations" ON resume_adaptations FOR ALL USING (true);

-- Comments
COMMENT ON TABLE resumes IS 'User resumes with versioning and contact info';
COMMENT ON TABLE resume_sections IS 'Flexible resume sections (experience, education, skills, etc.)';
COMMENT ON TABLE resume_adaptations IS 'Job-specific tailored resume versions with AI recommendations';
