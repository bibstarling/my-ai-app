-- Add API configuration table for user API keys
CREATE TABLE IF NOT EXISTS user_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'groq', 'system')),
  api_key TEXT, -- Encrypted in production
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clerk_id, provider)
);

-- Add usage tracking table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  feature TEXT NOT NULL, -- 'portfolio_chat', 'resume_generation', 'cover_letter', etc.
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_api_usage_clerk_id ON api_usage_logs(clerk_id);
CREATE INDEX idx_api_usage_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_user_api_configs_clerk_id ON user_api_configs(clerk_id);

-- Add RLS policies
ALTER TABLE user_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own API configs
CREATE POLICY "Users can view own API configs"
  ON user_api_configs FOR SELECT
  USING (auth.jwt() ->> 'sub' = clerk_id);

CREATE POLICY "Users can insert own API configs"
  ON user_api_configs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = clerk_id);

CREATE POLICY "Users can update own API configs"
  ON user_api_configs FOR UPDATE
  USING (auth.jwt() ->> 'sub' = clerk_id);

CREATE POLICY "Users can delete own API configs"
  ON user_api_configs FOR DELETE
  USING (auth.jwt() ->> 'sub' = clerk_id);

-- Users can only view their own usage logs
CREATE POLICY "Users can view own usage logs"
  ON api_usage_logs FOR SELECT
  USING (auth.jwt() ->> 'sub' = clerk_id);

-- Add function to get usage summary
CREATE OR REPLACE FUNCTION get_user_usage_summary(user_clerk_id TEXT, days INTEGER DEFAULT 30)
RETURNS TABLE (
  provider TEXT,
  feature TEXT,
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost_usd DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    api_usage_logs.provider,
    api_usage_logs.feature,
    COUNT(*)::BIGINT as total_requests,
    SUM(total_tokens)::BIGINT as total_tokens,
    SUM(estimated_cost_usd)::DECIMAL as total_cost_usd
  FROM api_usage_logs
  WHERE clerk_id = user_clerk_id
    AND created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY provider, feature
  ORDER BY total_cost_usd DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
