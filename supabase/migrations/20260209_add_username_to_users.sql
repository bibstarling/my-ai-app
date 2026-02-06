-- Add username support to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS username_updated_at TIMESTAMPTZ;

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Add constraint for username format validation (alphanumeric + hyphens, 3-30 chars)
ALTER TABLE users
  ADD CONSTRAINT username_format CHECK (
    username IS NULL OR (
      username ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
      AND username NOT IN ('admin', 'api', 'user', 'settings', 'portfolio', 'auth', 'dashboard', 'assistant')
    )
  );

-- Comments
COMMENT ON COLUMN users.username IS 'Unique username for user portfolio URLs, auto-generated from email';
COMMENT ON COLUMN users.username_updated_at IS 'Timestamp when username was last updated';
