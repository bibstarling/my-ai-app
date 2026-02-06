-- Add onboarding tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Comments
COMMENT ON COLUMN users.onboarding_completed IS 'Whether the user has completed the onboarding tour';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed';
