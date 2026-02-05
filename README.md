This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

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

### Environment Setup

Required environment variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# AI (Anthropic Claude)
ANTHROPIC_API_KEY=your_key

# Optional: Job Search API
JSEARCH_API_KEY=your_rapidapi_key
```

### Database Setup

Run the migrations in your Supabase SQL Editor:

1. Job ingestion schema: `supabase/migrations/20260204000000_job_ingestion_schema.sql`
2. Resume builder schema: `supabase/migrations/20260204100000_resume_builder_schema.sql`
3. Cover letter schema: `supabase/migrations/20260204110000_cover_letter_schema.sql`

## Project Structure

```
app/
├── assistant/          # AI assistant interface
├── resume-builder/     # Resume builder and job adaptation
│   ├── [id]/          # Resume editor
│   ├── [id]/adapt/    # Job adaptation interface
│   └── [id]/preview/  # Resume preview and export
├── admin/             # Admin dashboard
└── api/
    ├── chat/          # AI chat endpoint
    ├── jobs/          # Job listings API
    ├── matches/       # Job matching API
    └── resume/        # Resume CRUD and adaptation
lib/
├── jobs-ingestion/    # Job scraping and deduplication
└── types/             # TypeScript types
docs/
├── RESUME_BUILDER.md  # Resume builder documentation
└── JOB_INGESTION.md   # Job ingestion documentation
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
