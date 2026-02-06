-- Update language values from 'pt' to 'pt-BR'

-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_content_language_check;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_detected_language_check;

-- Update existing data
UPDATE users SET content_language = 'pt-BR' WHERE content_language = 'pt';
UPDATE jobs SET detected_language = 'pt-BR' WHERE detected_language = 'pt';

-- Add new constraints with pt-BR
ALTER TABLE users ADD CONSTRAINT users_content_language_check 
  CHECK (content_language IN ('en', 'pt-BR'));

ALTER TABLE jobs ADD CONSTRAINT jobs_detected_language_check 
  CHECK (detected_language IN ('en', 'pt-BR', 'unknown'));

-- Update comments
COMMENT ON COLUMN users.content_language IS 'Default language for AI-generated content (resumes, cover letters, etc.) - supports en, pt-BR';
COMMENT ON COLUMN jobs.detected_language IS 'Auto-detected language from job description (en, pt-BR, or unknown)';
