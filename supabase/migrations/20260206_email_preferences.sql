-- Create email preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email categories
  account_emails BOOLEAN NOT NULL DEFAULT true,          -- Account-related (welcome, approval, security)
  document_emails BOOLEAN NOT NULL DEFAULT true,         -- Resume/cover letter ready notifications
  application_emails BOOLEAN NOT NULL DEFAULT true,      -- Job application confirmations
  digest_emails BOOLEAN NOT NULL DEFAULT true,           -- Weekly digests and summaries
  marketing_emails BOOLEAN NOT NULL DEFAULT true,        -- Product updates and tips
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one preference record per user
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Enable RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = email_preferences.user_id));

CREATE POLICY "Users can update their own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = email_preferences.user_id));

CREATE POLICY "Users can insert their own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT clerk_id FROM users WHERE id = email_preferences.user_id));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_email_preferences_updated_at_trigger
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Function to create default email preferences for new users
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create email preferences when user is created
CREATE TRIGGER create_default_email_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();

-- Comments
COMMENT ON TABLE email_preferences IS 'User email notification preferences';
COMMENT ON COLUMN email_preferences.account_emails IS 'Account-related emails (welcome, approval, security) - cannot be fully disabled';
COMMENT ON COLUMN email_preferences.document_emails IS 'Resume and cover letter ready notifications';
COMMENT ON COLUMN email_preferences.application_emails IS 'Job application confirmation emails';
COMMENT ON COLUMN email_preferences.digest_emails IS 'Weekly digests and summary emails';
COMMENT ON COLUMN email_preferences.marketing_emails IS 'Product updates, tips, and marketing emails';
