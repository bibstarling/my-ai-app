-- Add setting to include portfolio link in generated documents
ALTER TABLE user_portfolios
ADD COLUMN IF NOT EXISTS include_portfolio_link BOOLEAN DEFAULT true;

COMMENT ON COLUMN user_portfolios.include_portfolio_link IS 'Whether to include portfolio link in generated resumes and cover letters';
