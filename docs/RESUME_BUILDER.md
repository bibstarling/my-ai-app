# Resume Builder Feature

A comprehensive AI-powered resume builder that adapts your resume to specific job postings.

## Features

### 1. Smart Resume Generation from Portfolio
- **Auto-Population**: Automatically generates resumes from your main portfolio page
- **AI Content Selection**: Intelligently selects the most relevant experiences and projects based on job requirements
- **Job-Specific Optimization**: Tailors your professional summary and emphasizes matching skills
- **One-Click Creation**: Generate a complete, job-specific resume in seconds

### 2. Resume Management
- **Create Multiple Resumes**: Maintain different versions for different job types
- **Contact Information**: Auto-populated from portfolio, editable per resume
- **Version Control**: Track primary resume and create variations

### 3. Section-Based Editing
Flexible resume sections including:
- **Professional Summary**: Compelling overview of your qualifications
- **Work Experience**: Detailed employment history with bullet points
- **Education**: Academic credentials and achievements
- **Skills**: Categorized technical and soft skills
- **Projects**: Portfolio items with descriptions
- **Certifications**: Professional credentials

### 4. AI-Powered Job Adaptation
- **Job Analysis**: AI analyzes job descriptions to identify key requirements
- **Match Scoring**: Get a 0-100 compatibility score
- **Keyword Suggestions**: Identify missing keywords from the job posting
- **Gap Analysis**: Understand what skills/experience you're missing
- **Strengths Highlighting**: See what makes you a strong candidate
- **Tailored Recommendations**: Get specific advice on how to improve your application

### 5. Professional Preview & Export
- **Live Preview**: See your resume in a clean, professional format
- **PDF Export**: Print or save as PDF using browser print
- **HTML Export**: Get a standalone HTML version
- **ATS-Friendly**: Optimized formatting for Applicant Tracking Systems

## Database Schema

### Tables

#### `resumes`
Main resume records with contact information.

```sql
- id: UUID (primary key)
- clerk_id: TEXT (user identifier)
- title: TEXT (e.g., "Product Manager Resume")
- is_primary: BOOLEAN (default resume flag)
- status: resume_status (draft, active, archived)
- full_name, email, phone, location: TEXT
- linkedin_url, portfolio_url: TEXT
- created_at, updated_at: TIMESTAMPTZ
```

#### `resume_sections`
Flexible sections for different content types.

```sql
- id: UUID (primary key)
- resume_id: UUID (foreign key to resumes)
- section_type: section_type (summary, experience, education, etc.)
- title: TEXT (optional custom title)
- sort_order: INT (display order)
- content: JSONB (flexible section content)
- created_at, updated_at: TIMESTAMPTZ
```

#### `resume_adaptations`
Job-specific tailored resume versions with AI analysis.

```sql
- id: UUID (primary key)
- resume_id: UUID (foreign key to resumes)
- job_id: UUID (foreign key to jobs, nullable)
- clerk_id: TEXT (user identifier)
- job_title, job_company: TEXT
- job_description: TEXT
- adapted_sections: JSONB (modified sections)
- match_score: INT (0-100)
- suggested_keywords, gaps, strengths: TEXT[]
- ai_recommendations: TEXT
- created_at, updated_at: TIMESTAMPTZ
```

## How It Works

The resume builder uses your portfolio page (`app/page.tsx`) as the single source of truth:

1. **Portfolio Data Extraction** (`lib/portfolio-data.ts`)
   - Your experiences, projects, skills, education, and certifications
   - Contact information and professional summary

2. **AI Content Selection**
   - Analyzes job description for required skills and qualifications
   - Scores each experience and project for relevance
   - Selects 2-4 most relevant experiences
   - Chooses 2-3 most impactful projects
   - Filters skills to match job requirements
   - Writes a job-specific professional summary

3. **Smart Resume Assembly**
   - Auto-populates sections with selected content
   - Formats descriptions as bullet points
   - Organizes by relevance (most relevant first)
   - Includes all education and relevant certifications

## API Routes

### Smart Generation
- `POST /api/resume/generate` - Auto-generate resume from portfolio
  - Body: `{ job_id, job_title?, job_description?, resume_title? }`
  - Returns: Complete resume with AI-selected content

### Resume CRUD
- `GET /api/resume` - List all resumes for user
- `POST /api/resume` - Create new resume
- `GET /api/resume/[id]` - Get single resume with sections
- `PATCH /api/resume/[id]` - Update resume
- `DELETE /api/resume/[id]` - Delete resume

### Sections
- `POST /api/resume/[id]/sections` - Add section to resume
- `PATCH /api/resume/[id]/sections/[sectionId]` - Update section
- `DELETE /api/resume/[id]/sections/[sectionId]` - Delete section

### AI Adaptation
- `POST /api/resume/adapt` - Generate AI-adapted version for a job
  - Body: `{ resume_id, job_id }`
  - Returns: adapted resume with AI analysis

### Export
- `GET /api/resume/[id]/export` - Export resume as HTML

## Pages

### `/resume-builder`
Main dashboard showing all resumes with cards displaying:
- Resume title and status
- Contact name
- Section count
- Last updated date
- Actions: Edit, Preview, Duplicate, Delete

### `/resume-builder/[id]`
Resume editor with:
- Contact information form
- Section-by-section editing
- Add/remove sections
- Real-time auto-save
- Navigation to preview and adapt

### `/resume-builder/[id]/preview`
Professional formatted preview with:
- Print-friendly layout
- PDF export (browser print)
- HTML export
- Clean typography optimized for ATS

### `/resume-builder/[id]/adapt`
AI job adaptation interface with:
- Job listing selection
- AI analysis trigger
- Match score visualization
- Strengths and gaps display
- Keyword recommendations
- Preview adapted resume

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the resume builder schema
# Run this in your Supabase SQL Editor or via CLI
cat supabase/migrations/20260204100000_resume_builder_schema.sql
```

### 2. Configure Environment Variables

Ensure you have:
- `ANTHROPIC_API_KEY` - For AI-powered resume adaptation
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### 3. Access the Feature

Navigate to `/resume-builder` in your application.

## Usage Flow

### Option A: Generate from Job (Recommended)

1. **Select Job Posting**
   - Go to `/resume-builder`
   - Click "Generate from Job"
   - Select a job from your matches

2. **AI Generates Resume**
   - AI analyzes job requirements
   - Selects most relevant experience and projects
   - Creates tailored professional summary
   - Auto-populates all sections

3. **Review & Refine**
   - Review generated content
   - Edit any section as needed
   - Add or remove sections

4. **Export**
   - Preview resume
   - Save as PDF via browser print

### Option B: Manual Creation

1. **Create Blank Resume**
   - Click "New Blank Resume"
   - Enter contact information
   - Save resume

2. **Add Sections Manually**
   - Click "Add Section"
   - Choose section type
   - Fill in content
   - Add multiple entries as needed

3. **Further Adaptation (Optional)**
   - Click "Adapt to Job"
   - Get additional recommendations
   - See match score and gaps

4. **Export**
   - Go to Preview
   - Use browser print (Ctrl+P / Cmd+P) to save as PDF
   - Or download HTML version

## AI Selection & Adaptation Details

The AI uses Claude (Anthropic) in two stages:

### Stage 1: Content Selection (Generate from Job)

When generating a resume from your portfolio:

1. **Analyzes** the job description for:
   - Required skills and qualifications
   - Experience level expectations
   - Key responsibilities
   - Company culture and values

2. **Scores** your portfolio content:
   - Each experience rated for relevance
   - Each project evaluated for alignment
   - Skills matched to requirements

3. **Selects** the best fit:
   - Top 2-4 most relevant experiences
   - 2-3 most impressive projects
   - 10-15 most important skills
   - Determines if certifications add value

4. **Generates** tailored content:
   - Custom professional summary
   - Job-specific skill emphasis
   - Relevant achievements highlighted

### Stage 2: Further Adaptation (Existing Resume)

When adapting an existing resume:

1. **Analyze** the job description for:
   - Required skills and qualifications
   - Preferred experience
   - Key responsibilities
   - Company culture signals

2. **Compare** with your resume:
   - Identify matching qualifications
   - Find skill gaps
   - Detect missing keywords

3. **Generate** recommendations:
   - Rewrite summary for the specific role
   - Reorder experience to highlight relevance
   - Add job-specific keywords naturally
   - Suggest bullet point improvements
   - Provide overall strategy advice

4. **Score** compatibility (0-100):
   - 80-100: Excellent fit
   - 60-79: Good fit with some gaps
   - 40-59: Moderate fit, significant gaps
   - 0-39: Poor fit, major gaps

## Best Practices

### Portfolio Maintenance
Your portfolio page is the source of truth for all resumes:
- **Keep it updated**: Add new experiences and projects regularly
- **Be detailed**: Rich descriptions enable better AI selection
- **Quantify achievements**: Numbers make stronger resume bullets
- **Tag appropriately**: Skills and tags help AI match to jobs

### Resume Writing
- Use action verbs (Led, Developed, Increased, etc.)
- Quantify achievements with numbers
- Focus on impact and results
- Keep bullets concise (1-2 lines)
- Tailor experience to target roles

### Smart Generation
- **Let AI do the selection**: Trust the relevance scoring
- **Generate fresh for each job type**: Don't reuse for different roles
- **Review before sending**: AI is smart but not perfect
- **Edit freely**: Generated content is a starting point
- **Keep multiple versions**: Generate different resumes for different job types

### AI Adaptation
- Use "Generate from Job" for best results
- "Adapt Current Resume" is for fine-tuning existing resumes
- Review AI suggestions critically
- Maintain honesty - don't add false information
- Test generated resumes with real applications

### ATS Optimization
- Use standard section headings
- Avoid tables, images, or complex formatting
- Include relevant keywords naturally
- Use common job titles
- Save/export as PDF for submission

## Troubleshooting

### AI Adaptation Not Working
- Check `ANTHROPIC_API_KEY` is set correctly
- Verify you have API credits
- Ensure job description has enough detail

### Sections Not Saving
- Check network tab for API errors
- Verify authentication is working
- Check Supabase RLS policies

### Export Not Working
- Ensure browser allows popups
- Try different browser if print fails
- Use HTML export as fallback

## Future Enhancements

Potential improvements:
- [ ] Real-time collaboration on resumes
- [ ] Template library with different styles
- [ ] Direct application tracking
- [ ] Cover letter generator
- [ ] LinkedIn profile sync
- [ ] Multiple language support
- [ ] Advanced formatting options
- [ ] Version history and rollback
- [ ] Skill gap training recommendations
