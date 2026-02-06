-- Add markdown column to user_portfolios table
ALTER TABLE user_portfolios
ADD COLUMN IF NOT EXISTS markdown TEXT;

COMMENT ON COLUMN user_portfolios.markdown IS 'Markdown content from Professional Profile page - source of truth for AI-generated content';
