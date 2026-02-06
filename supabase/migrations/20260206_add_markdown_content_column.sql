-- Add markdown_content column to user_portfolios table
ALTER TABLE user_portfolios ADD COLUMN IF NOT EXISTS markdown_content TEXT;

-- Add comment
COMMENT ON COLUMN user_portfolios.markdown_content IS 'Markdown source of truth for all AI features (resume, cover letter, etc.)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_portfolios_markdown_content ON user_portfolios(clerk_id) WHERE markdown_content IS NOT NULL;
