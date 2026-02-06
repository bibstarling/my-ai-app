# Applause 👏

**Your Career Deserves Applause!**

Applause is a fun, AI-powered career platform that makes job searching feel like a celebration. Build stunning portfolios, create standout resumes, and find your dream role—all with AI as your cheerleader! 🎉

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Brand Identity

Applause celebrates career achievements and makes job searching exciting. Our warm, sophisticated brand turns the stress of job hunting into moments worth celebrating.

**Brand Colors:**
- 🟤 **Terra Cotta** (`#e07a5f`) - Primary brand color (warm, earthy)
- ⚫ **Slate Gray** (`#475569`) - Secondary accent (modern, neutral)
- 💚 **Emerald** (`#10b981`) - Success states & positive actions
- 🌊 **Ocean Blue** (`#3b82f6`) - Trust & professionalism
- ⚪ **Light Slate** (`#64748b`) - Supporting neutrals

**Documentation:**
- [docs/BRAND_GUIDELINES.md](./docs/BRAND_GUIDELINES.md) - Complete brand guidelines
- [docs/ACCESSIBILITY_COMPLIANCE.md](./docs/ACCESSIBILITY_COMPLIANCE.md) - Accessibility standards

## Features

### 🎨 AI Portfolio Builder
Build your professional portfolio website by chatting with AI:

**Content Input:**
- **Natural Conversation**: Tell AI about your work and achievements
- **File Uploads**: Upload resumes, certificates, project screenshots
- **URL Scraping**: Add links to GitHub, LinkedIn, articles, projects
- **Clipboard Paste**: Paste screenshots directly with Ctrl+V

**Features:**
- **Live Preview**: See your portfolio update in real-time
- **Custom URLs**: Get your unique portfolio at `/user/username`
- **Privacy Controls**: Public or private portfolio settings
- **AI-Powered**: AI structures your content professionally
- **Admin Sync**: Admin's portfolio updates the main page automatically

**Documentation:**
- [docs/PORTFOLIO_BUILDER.md](./docs/PORTFOLIO_BUILDER.md) - Complete feature documentation

### 🚀 Smart Resume & Cover Letter Builder
An AI-powered resume builder that automatically generates job-specific resumes from your portfolio:

**Smart Generation:**
- **Portfolio-Powered**: Uses your main page as single source of truth
- **AI Content Selection**: Automatically picks your most relevant experience and projects
- **Job-Specific Optimization**: Tailors summary and emphasizes matching skills
- **One-Click Creation**: Generate a complete, tailored resume in seconds

**Cover Letter Generation:**
- **AI-Powered Writing**: Generates compelling, job-specific cover letters
- **Smart Content Selection**: Highlights your most relevant achievements
- **Professional Structure**: Opening hook, body paragraphs, strong closing
- **Full Customization**: Edit any section, add recipient details

**Advanced Features:**
- **Multi-Version Management**: Create and manage multiple versions
- **Flexible Editing**: Fine-tune any AI-generated content
- **Match Scoring**: Get compatibility scores and gap analysis for each job
- **Professional Export**: PDF and HTML export with ATS-friendly formatting
- **Unified Workflow**: Generate both resume and cover letter for same job

**Documentation:**
- [docs/JOB_APPLICATION_WORKFLOW.md](./docs/JOB_APPLICATION_WORKFLOW.md) - Complete application workflow
- [docs/SMART_RESUME_GENERATION.md](./docs/SMART_RESUME_GENERATION.md) - Resume generation details
- [docs/COVER_LETTER_GENERATOR.md](./docs/COVER_LETTER_GENERATOR.md) - Cover letter feature
- [docs/RESUME_BUILDER.md](./docs/RESUME_BUILDER.md) - Detailed documentation

### Job Matching & Search
- Multi-source job aggregation (RemoteOK, Remotive, Adzuna)
- Skills-based matching and ranking
- Remote eligibility filtering
- Job ingestion and deduplication

See [docs/JOB_INGESTION.md](./docs/JOB_INGESTION.md) for job ingestion details.

### Personal AI Assistant
- Career coaching and job search help
- Interview preparation
- Cover letter assistance

### 📧 Email System
Professional email notifications powered by **Resend** with beautiful React Email templates:

**Active Email Flows:**
- **Welcome Email** - Sent when users sign up
- **Approval Notifications** - Waiting for approval & confirmation emails
- **Document Ready** - Notifies when resume/cover letter is generated
- **Job Application** - Confirmation when tracking job applications (ready to integrate)
- **Password Reset** - For forgotten password flows (template ready)

**Features:**
- 🎨 Beautiful, responsive email templates
- 📊 Built-in analytics and tracking
- 🚀 3,000 emails/month free tier
- ✅ Easy integration and customization

**Quick Setup:**
1. Sign up at [resend.com](https://resend.com) (free)
2. Get your API key
3. Add `RESEND_API_KEY` to `.env.local`
4. Done! Emails are automatically sent

**User Preferences:**
Users can control which emails they receive via `/settings/email-preferences` with 5 categories:
- Account & Security
- Document Notifications  
- Job Applications
- Weekly Digests
- Marketing & Tips

**Documentation:**
- [docs/EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md) - Quick 5-minute setup
- [docs/EMAIL_SYSTEM.md](./docs/EMAIL_SYSTEM.md) - Complete documentation
- [docs/EMAIL_FLOWS.md](./docs/EMAIL_FLOWS.md) - Visual flow diagrams
- [docs/EMAIL_PREFERENCES.md](./docs/EMAIL_PREFERENCES.md) - User preferences system

**Preview Templates:**
Visit `http://localhost:3000/api/email/preview?template=welcome` to see templates in your browser.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 💳 API Configuration & Usage Tracking
Users can connect their own LLM API keys instead of using the shared system API:

**Supported Providers:**
- **Groq** (FREE tier - recommended!) - Up to 7,000 requests/day free
- **OpenAI** (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
- **Anthropic** (Claude Sonnet 4, Claude Haiku)

**Features:**
- 🔑 Secure API key management
- 📊 Detailed usage tracking by feature and provider
- 💰 Real-time cost estimates
- 🚨 Usage limits and alerts for shared API
- ⚡ Automatic fallback to system API if not configured

**Documentation:**
- [docs/API_CONFIGURATION.md](./docs/API_CONFIGURATION.md) - Complete setup guide

### Environment Setup

Required environment variables (see `.env.example` for full reference):

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# AI (Anthropic Claude) - Used as system fallback API
ANTHROPIC_API_KEY=your_key

# Email (Resend) - Get free key at resend.com
RESEND_API_KEY=re_your_key
EMAIL_FROM=My AI App <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Job Search API
JSEARCH_API_KEY=your_rapidapi_key
```

### Database Setup

Run the migrations in your Supabase SQL Editor:

1. Job ingestion schema: `supabase/migrations/20260204000000_job_ingestion_schema.sql`
2. Resume builder schema: `supabase/migrations/20260204100000_resume_builder_schema.sql`
3. Cover letter schema: `supabase/migrations/20260204110000_cover_letter_schema.sql`
4. Username support: `supabase/migrations/20260209_add_username_to_users.sql`
5. Portfolio tables: `supabase/migrations/20260209_create_portfolio_tables.sql`
6. Portfolio storage: `supabase/migrations/20260209_create_portfolio_storage.sql`
7. API keys & usage tracking: `supabase/migrations/20260210_add_api_keys_and_usage.sql`

## Project Structure

```
app/
├── assistant/          # AI assistant interface
├── portfolio/          # Portfolio builder
│   └── builder/       # Chat-based portfolio builder UI
├── user/[username]/    # Public portfolio pages
├── resume-builder/     # Resume builder and job adaptation
│   ├── [id]/          # Resume editor
│   ├── [id]/adapt/    # Job adaptation interface
│   └── [id]/preview/  # Resume preview and export
├── settings/          # User settings
│   └── portfolio/     # Portfolio settings (username, privacy)
├── admin/             # Admin dashboard
└── api/
    ├── chat/          # AI chat endpoint
    ├── portfolio/     # Portfolio APIs (CRUD, chat, upload, scrape)
    ├── jobs/          # Job listings API
    ├── matches/       # Job matching API
    └── resume/        # Resume CRUD and adaptation
lib/
├── jobs-ingestion/    # Job scraping and deduplication
├── portfolio-builder.ts  # Portfolio AI logic
├── file-processor.ts    # File upload and AI analysis
├── url-scraper.ts       # URL scraping with Puppeteer
├── username.ts          # Username validation and generation
├── email/             # Email system and templates
│   ├── templates/     # React Email templates
│   ├── config.ts      # Email configuration
│   └── send.ts        # Email sending functions
└── types/             # TypeScript types
docs/
├── PORTFOLIO_BUILDER.md  # Portfolio builder documentation
├── RESUME_BUILDER.md     # Resume builder documentation
├── JOB_INGESTION.md      # Job ingestion documentation
├── EMAIL_SETUP_GUIDE.md  # Quick email setup (5 min)
├── EMAIL_SYSTEM.md       # Complete email documentation
└── EMAIL_FLOWS.md        # Email flow diagrams
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
