# Portfolio System Architecture

## Overview

The portfolio system uses **markdown as the single source of truth** for all AI-powered features. This ensures consistency across resume generation, cover letter creation, and portfolio publishing.

## System Components

### 1. **Markdown (Source of Truth)**
- Stored in user's portfolio database
- Human-readable and editable
- Used by all AI flows for context
- Parsed into structured JSON for display

### 2. **WYSIWYG Editor**
- Notion-like formatting toolbar
- Live markdown editing
- Keyboard shortcuts (Cmd/Ctrl+B for bold, etc.)
- Auto-saves to database

### 3. **AI Assistant**
- Processes uploaded materials:
  - PDFs (resume, certificates)
  - Documents (Word, text files)
  - Images (screenshots, photos)
  - Links (LinkedIn, GitHub, articles)
- Extracts relevant information
- Updates markdown automatically
- Maintains formatting consistency

### 4. **Portfolio Preview**
- Shows final published HTML
- Uses root page design as baseline
- AI-adapted content using existing components
- Real-time preview of changes

## Data Flow

```
User Actions:
  ├─→ Upload Resume/Documents → AI extracts data → Updates Markdown
  ├─→ Paste LinkedIn URL → AI scrapes & summarizes → Updates Markdown
  ├─→ Direct Edit in WYSIWYG → Saves to Markdown
  └─→ Chat with AI → AI processes request → Updates Markdown

Markdown (Source of Truth):
  ├─→ Portfolio Preview (HTML rendering)
  ├─→ Resume Generation (AI formats for jobs)
  ├─→ Cover Letter Generation (AI tailors to roles)
  ├─→ Job Matching (AI compares to job descriptions)
  └─→ Any future AI features
```

## AI Integration Points

### Portfolio Building (`/api/portfolio/chat`)
- Accepts: message, attachments, currentMarkdown
- Returns: message, updatedMarkdown, changes
- AI extracts info from materials and updates markdown

### Resume Generation (`/api/resume/generate`)
- Reads: markdown from user's portfolio
- Returns: formatted resume (PDF/DOCX)
- Tailored to specific job if provided

### Cover Letter Generation (`/api/cover-letter/generate`)
- Reads: markdown from user's portfolio
- Inputs: job description, company info
- Returns: personalized cover letter

### Job Matching (`/api/jobs/match`)
- Reads: markdown from user's portfolio
- Compares: to job requirements
- Returns: match score and gaps

## Benefits

1. **Single Source of Truth**: No data duplication or sync issues
2. **Human-Readable**: Users can read/edit their data easily
3. **Version Control**: Markdown can be diffed and versioned
4. **AI-Friendly**: LLMs excel at understanding markdown
5. **Flexible**: Easy to add new AI features using markdown context
6. **Portable**: Users can export their markdown anytime

## Database Schema

```sql
user_portfolios:
  - id (uuid)
  - clerk_id (text)
  - portfolio_data (jsonb) -- Structured data for display
  - markdown_content (text) -- Source of truth
  - status (text) -- 'draft' or 'published'
  - is_public (boolean)
  - messages (jsonb) -- Chat history
```

## API Routes

- `POST /api/portfolio/chat` - AI processes materials, updates markdown
- `POST /api/portfolio/parse-markdown` - Converts markdown → JSON
- `POST /api/portfolio/update` - Saves portfolio data
- `GET /api/portfolio/current` - Gets user's portfolio
- `POST /api/portfolio/publish` - Publishes portfolio
- `GET /api/portfolio/[username]` - Gets public portfolio

## Future Enhancements

- LinkedIn import automation
- GitHub projects sync
- Real-time collaborative editing
- Version history / undo
- Template library
- Export to PDF
- Custom domain mapping
