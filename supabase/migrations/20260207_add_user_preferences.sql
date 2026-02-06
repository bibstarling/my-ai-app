-- Add content generation preferences to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS content_language TEXT DEFAULT 'en' CHECK (content_language IN ('en', 'pt-BR'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_content_language ON users(content_language);

-- Comment
COMMENT ON COLUMN users.content_language IS 'Default language for AI-generated content (resumes, cover letters, etc.)';
