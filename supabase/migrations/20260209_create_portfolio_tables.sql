-- Create portfolio status enum
CREATE TYPE portfolio_status AS ENUM ('draft', 'published');

-- Create portfolio link status enum
CREATE TYPE portfolio_link_status AS ENUM ('pending', 'scraped', 'failed');

-- ============================================================================
-- user_portfolios table - Main portfolio records
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  status portfolio_status NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT false,
  portfolio_data JSONB NOT NULL DEFAULT '{}',
  seo_description TEXT,
  custom_domain TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for user_portfolios
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_portfolios_clerk_id ON user_portfolios(clerk_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_portfolios_custom_domain ON user_portfolios(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_portfolios_status ON user_portfolios(status);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_is_public ON user_portfolios(is_public);

-- Enable RLS for user_portfolios
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_portfolios
CREATE POLICY "Users can view their own portfolio"
  ON user_portfolios FOR SELECT
  USING (auth.uid()::text = clerk_id OR is_public = true);

CREATE POLICY "Users can insert their own portfolio"
  ON user_portfolios FOR INSERT
  WITH CHECK (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update their own portfolio"
  ON user_portfolios FOR UPDATE
  USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can delete their own portfolio"
  ON user_portfolios FOR DELETE
  USING (auth.uid()::text = clerk_id);

-- Function to update user_portfolios updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_portfolios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_portfolios_updated_at_trigger
  BEFORE UPDATE ON user_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_user_portfolios_updated_at();

-- Comments for user_portfolios
COMMENT ON TABLE user_portfolios IS 'User portfolio records with structured portfolio data';
COMMENT ON COLUMN user_portfolios.portfolio_data IS 'Structured portfolio content matching portfolio-data.ts format';
COMMENT ON COLUMN user_portfolios.status IS 'Portfolio publication status';
COMMENT ON COLUMN user_portfolios.is_public IS 'Whether the portfolio is publicly accessible';

-- ============================================================================
-- portfolio_chat_messages table - Chat history for portfolio building
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for portfolio_chat_messages
CREATE INDEX IF NOT EXISTS idx_portfolio_chat_messages_portfolio_id ON portfolio_chat_messages(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_chat_messages_created_at ON portfolio_chat_messages(created_at);

-- Enable RLS for portfolio_chat_messages
ALTER TABLE portfolio_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_chat_messages
CREATE POLICY "Users can view their own portfolio chat messages"
  ON portfolio_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_chat_messages.portfolio_id
      AND user_portfolios.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert messages to their own portfolio"
  ON portfolio_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_chat_messages.portfolio_id
      AND user_portfolios.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own portfolio chat messages"
  ON portfolio_chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_chat_messages.portfolio_id
      AND user_portfolios.clerk_id = auth.uid()::text
    )
  );

-- Comments for portfolio_chat_messages
COMMENT ON TABLE portfolio_chat_messages IS 'Chat history for portfolio building with AI assistant';
COMMENT ON COLUMN portfolio_chat_messages.role IS 'Message role: user, assistant, or system';
COMMENT ON COLUMN portfolio_chat_messages.metadata IS 'Additional metadata like file references, link references';

-- ============================================================================
-- portfolio_uploads table - File uploads (images, PDFs, documents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'document')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_text TEXT,
  ai_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for portfolio_uploads
CREATE INDEX IF NOT EXISTS idx_portfolio_uploads_portfolio_id ON portfolio_uploads(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_uploads_clerk_id ON portfolio_uploads(clerk_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_uploads_file_type ON portfolio_uploads(file_type);

-- Enable RLS for portfolio_uploads
ALTER TABLE portfolio_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_uploads
CREATE POLICY "Users can view their own uploads"
  ON portfolio_uploads FOR SELECT
  USING (auth.uid()::text = clerk_id);

CREATE POLICY "Public can view uploads of public portfolios"
  ON portfolio_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_uploads.portfolio_id
      AND user_portfolios.is_public = true
      AND user_portfolios.status = 'published'
    )
  );

CREATE POLICY "Users can insert their own uploads"
  ON portfolio_uploads FOR INSERT
  WITH CHECK (auth.uid()::text = clerk_id);

CREATE POLICY "Users can delete their own uploads"
  ON portfolio_uploads FOR DELETE
  USING (auth.uid()::text = clerk_id);

-- Comments for portfolio_uploads
COMMENT ON TABLE portfolio_uploads IS 'File uploads for portfolio (images, PDFs, documents)';
COMMENT ON COLUMN portfolio_uploads.file_type IS 'Type of file: image, pdf, or document';
COMMENT ON COLUMN portfolio_uploads.extracted_text IS 'AI-extracted text content from the file';
COMMENT ON COLUMN portfolio_uploads.ai_analysis IS 'AI analysis and insights about the file content';

-- ============================================================================
-- portfolio_links table - Scraped URLs and external references
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  scraped_content TEXT,
  metadata JSONB DEFAULT '{}',
  status portfolio_link_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for portfolio_links
CREATE INDEX IF NOT EXISTS idx_portfolio_links_portfolio_id ON portfolio_links(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_links_status ON portfolio_links(status);

-- Enable RLS for portfolio_links
ALTER TABLE portfolio_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio_links
CREATE POLICY "Users can view their own links"
  ON portfolio_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_links.portfolio_id
      AND user_portfolios.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert links to their own portfolio"
  ON portfolio_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_links.portfolio_id
      AND user_portfolios.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own portfolio links"
  ON portfolio_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_links.portfolio_id
      AND user_portfolios.clerk_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own portfolio links"
  ON portfolio_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_portfolios
      WHERE user_portfolios.id = portfolio_links.portfolio_id
      AND user_portfolios.clerk_id = auth.uid()::text
    )
  );

-- Function to update portfolio_links updated_at timestamp
CREATE OR REPLACE FUNCTION update_portfolio_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_portfolio_links_updated_at_trigger
  BEFORE UPDATE ON portfolio_links
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_links_updated_at();

-- Comments for portfolio_links
COMMENT ON TABLE portfolio_links IS 'Scraped URLs and external references for portfolio';
COMMENT ON COLUMN portfolio_links.scraped_content IS 'Main content extracted from the URL';
COMMENT ON COLUMN portfolio_links.metadata IS 'Open Graph data, favicon, and other metadata';
COMMENT ON COLUMN portfolio_links.status IS 'Scraping status: pending, scraped, or failed';
