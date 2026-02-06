# Portfolio Builder Feature

## Overview

The Portfolio Builder allows users to create AI-powered professional portfolio websites by chatting with an AI assistant and uploading various content types. Users can publish their portfolios to custom URLs at `/user/username`.

## Features

### Core Functionality

- **AI-Powered Chat Interface**: Build your portfolio through natural conversation
- **Multi-Input Support**: 
  - Text messages
  - File uploads (images, PDFs, documents)
  - URL scraping (articles, projects, LinkedIn, GitHub)
  - Clipboard paste for screenshots
- **Live Preview**: Real-time preview of your portfolio as you build it
- **Privacy Controls**: Public/private portfolio settings
- **Custom URLs**: Each user gets a unique portfolio at `/user/username`
- **Admin Sync**: Admin's portfolio automatically syncs to the root page (`/`)

### Content Processing

- **Images**: AI vision analysis to extract text and context
- **PDFs**: Text extraction and content categorization
- **URLs**: Automatic scraping and relevance analysis
- **Chat**: AI structures unstructured information into portfolio format

## User Workflows

### First-Time User

1. Sign up → Username auto-generated from email
2. Navigate to `/portfolio/builder`
3. System creates portfolio record (draft, private)
4. Upload resume or paste screenshots
5. Chat with AI to add experiences and projects
6. Preview portfolio in real-time
7. Set username in `/settings/portfolio`
8. Publish portfolio
9. Share link: `yourdomain.com/user/john-doe`

### Admin User

1. Navigate to `/portfolio/builder`
2. System loads current portfolio-data.ts content
3. Edit via chat or uploads
4. Preview shows changes
5. Click "Publish"
6. System saves to database AND updates `portfolio-data.ts`
7. Root page (`/`) reflects updated content
8. Admin portfolio also accessible at `/user/admin-username`

## API Endpoints

### Portfolio Management
- `POST /api/portfolio/init` - Initialize user's portfolio
- `GET /api/portfolio/current` - Get current user's portfolio
- `GET /api/portfolio/preview` - Get draft preview
- `GET /api/portfolio/[username]` - Get portfolio by username (public)
- `PATCH /api/portfolio/settings` - Update settings
- `POST /api/portfolio/publish` - Publish/unpublish portfolio

### Content Input
- `POST /api/portfolio/chat` - Chat with AI
- `POST /api/portfolio/upload` - Upload files
- `POST /api/portfolio/scrape` - Scrape URLs
- `DELETE /api/portfolio/upload?id=xyz` - Delete uploaded file
- `DELETE /api/portfolio/scrape?id=xyz` - Delete scraped link

### Admin
- `POST /api/portfolio/sync-main-page` - Sync admin portfolio to portfolio-data.ts

### Utilities
- `GET /api/portfolio/check-username` - Check username availability

## Database Schema

### Tables

**user_portfolios**
- Main portfolio records
- Contains structured portfolio_data (JSON)
- Status: draft | published
- Privacy: is_public boolean

**portfolio_chat_messages**
- Chat history for portfolio building
- Linked to portfolio via portfolio_id

**portfolio_uploads**
- File uploads (images, PDFs, documents)
- Stores file metadata and AI analysis
- Files stored in Supabase Storage

**portfolio_links**
- Scraped URLs and external references
- Stores extracted content and metadata

**users** (updated)
- Added username column
- Unique usernames for portfolio URLs

## File Storage

**Supabase Storage Bucket: `portfolio-uploads`**
- Path structure: `{user-id}/{file-id}-{filename}`
- 10MB max file size
- Public read access for published portfolios
- Supports: images, PDFs, text documents

## Pages

### `/portfolio/builder`
Two-column layout:
- **Left**: Chat interface with upload/link buttons
- **Right**: Live portfolio preview

Features:
- Real-time AI responses
- File drag-and-drop
- Clipboard paste support (Ctrl+V / Cmd+V)
- Publish/unpublish button
- Privacy toggle
- View live portfolio link

### `/user/[username]`
Public portfolio page showing:
- Contact information
- About section
- Experience timeline
- Projects grid
- Skills by category
- Education
- Certifications
- Achievements
- Articles & talks

### `/settings/portfolio`
Portfolio configuration:
- Username editor with availability check
- Privacy toggle (public/private)
- SEO description
- Quick links to builder and live page
- Delete portfolio (danger zone)

## AI System Prompts

The portfolio builder uses Claude to process user inputs and maintain structured portfolio data. The AI:

1. Extracts structured information from conversations
2. Analyzes uploaded images and documents
3. Scrapes and categorizes web content
4. Suggests improvements and asks clarifying questions
5. Maintains consistency with existing portfolio content

## Setup Instructions

### 1. Database Migrations

Run these migrations in order:

```bash
# Add username to users
supabase/migrations/20260209_add_username_to_users.sql

# Create portfolio tables
supabase/migrations/20260209_create_portfolio_tables.sql

# Create storage bucket
supabase/migrations/20260209_create_portfolio_storage.sql
```

### 2. Environment Variables

Already configured (no new variables needed):
- `ANTHROPIC_API_KEY` - Claude AI
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin

### 3. Development

```bash
npm run dev
```

Navigate to `/portfolio/builder` to start building your portfolio.

## Testing Checklist

- [ ] User registration auto-generates username
- [ ] Username validation and uniqueness checking
- [ ] File upload (images, PDFs)
- [ ] Clipboard paste for images (Ctrl+V / Cmd+V)
- [ ] URL scraping and content extraction
- [ ] Chat interaction updates portfolio
- [ ] Live preview updates in real-time
- [ ] Publish/unpublish toggle works
- [ ] Privacy toggle (public/private) works
- [ ] Portfolio accessible at `/user/username`
- [ ] Admin edits sync to root page
- [ ] 404 for non-existent/private portfolios
- [ ] Settings page username editor works
- [ ] Mobile responsive layout

## Future Enhancements

- Custom domain support (full implementation)
- Portfolio themes and templates
- Multiple portfolio versions
- Export portfolio as PDF
- Analytics (views, clicks)
- Portfolio collaboration
- Social sharing previews
- Portfolio search/discovery
- LinkedIn import integration

## Troubleshooting

### Portfolio not showing

- Check if username is set in settings
- Verify portfolio is published
- Check if privacy is set to public

### File upload fails

- Check file size (max 10MB)
- Verify file type is supported
- Check Supabase Storage bucket exists

### URL scraping fails

- Some sites block scraping (403/404)
- User can manually add information via chat
- Check Puppeteer is installed

### Admin sync not working

- Only works for admin users
- Check file write permissions
- May not work in production (read-only filesystem)

## Security

- Row Level Security (RLS) on all tables
- File uploads restricted to authenticated users
- Public access only for published portfolios
- Username validation prevents reserved words
- File size limits prevent abuse
- Admin-only sync endpoint

## Performance

- Database indexed on clerk_id, username, status
- Portfolio data stored as JSONB for fast queries
- Static portfolio pages can be cached
- Image optimization recommended for production
- Consider CDN for file storage
