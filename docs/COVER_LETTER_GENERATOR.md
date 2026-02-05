# AI Cover Letter Generator

An intelligent cover letter generator that automatically creates compelling, job-specific cover letters from your portfolio.

## Overview

The cover letter generator works exactly like the resume builder - it analyzes job postings and your portfolio to create tailored, professional cover letters that highlight your most relevant qualifications.

## Features

### Smart Content Selection
- **AI Analysis**: Analyzes job description for key requirements
- **Experience Matching**: Selects 1-2 most relevant experiences to highlight
- **Project Showcasing**: Chooses impressive projects that demonstrate capability
- **Achievement Focus**: Emphasizes metrics and concrete outcomes

### Professional Structure
- **Compelling Opening**: Hooks reader with enthusiasm and company-specific details
- **Body Paragraphs**: 2-3 focused paragraphs on qualifications
- **Strong Closing**: Clear call to action with enthusiasm

### Customization
- **Tone Selection**: Professional, Enthusiastic, or Formal
- **Recipient Details**: Add hiring manager name and title
- **Editable Content**: Full control to refine any paragraph
- **Multiple Drafts**: Generate different versions for different applications

## How It Works

### 1. Job Analysis
AI examines the job posting for:
- Required skills and qualifications
- Key responsibilities
- Company culture signals
- Specific project or experience needs

### 2. Content Selection from Portfolio
From your portfolio data, AI selects:
- **1-2 Most Relevant Experiences**: Based on role requirements
- **1-2 Key Projects**: That demonstrate required capabilities
- **3-4 Selling Points**: Core strengths to emphasize

### 3. Letter Generation
AI crafts:
- **Opening Paragraph**: Company-specific hook showing genuine interest
- **Body Paragraph 1**: Highlights relevant experience with specific achievements
- **Body Paragraph 2**: Showcases key project with metrics and outcomes
- **Body Paragraph 3** (optional): Cultural fit or unique qualifications
- **Closing Paragraph**: Enthusiastic close with call to action

## Database Schema

### `cover_letters` Table

```sql
- id: UUID (primary key)
- clerk_id: TEXT (user identifier)
- job_id: UUID (reference to jobs table)
- resume_id: UUID (optional reference to associated resume)

-- Job context
- job_title: TEXT
- job_company: TEXT
- job_description: TEXT

-- Recipient details
- recipient_name: TEXT (optional)
- recipient_title: TEXT (optional)
- company_address: TEXT (optional)

-- Letter content
- opening_paragraph: TEXT
- body_paragraphs: TEXT[] (array of 2-3 paragraphs)
- closing_paragraph: TEXT

-- Metadata
- status: cover_letter_status (draft, final, archived)
- tone: TEXT (professional, enthusiastic, formal)

-- AI context
- selected_experiences: TEXT[] (which experiences were highlighted)
- selected_projects: TEXT[] (which projects were mentioned)
- key_points: TEXT[] (main selling points)

- created_at, updated_at: TIMESTAMPTZ
```

## API Endpoints

### Generate
**`POST /api/cover-letter/generate`**

Request:
```json
{
  "job_id": "uuid",              // Required (or job_title + job_company)
  "job_title": "string",         // Optional if job_id provided
  "job_company": "string",       // Optional if job_id provided
  "job_description": "string",   // Optional if job_id provided
  "resume_id": "uuid",           // Optional, link to resume
  "tone": "professional",        // Optional: professional|enthusiastic|formal
  "recipient_name": "string",    // Optional
  "recipient_title": "string"    // Optional
}
```

Response:
```json
{
  "cover_letter": { /* full cover letter object */ },
  "reasoning": "AI explanation of content selection",
  "success": true
}
```

### List & Manage
- `GET /api/cover-letter` - List all cover letters
- `GET /api/cover-letter/[id]` - Get single cover letter
- `PATCH /api/cover-letter/[id]` - Update cover letter
- `DELETE /api/cover-letter/[id]` - Delete cover letter

### Export
- `GET /api/cover-letter/[id]/export` - Export as formatted HTML for PDF

## User Interface

### Main Page (`/cover-letters`)
Dashboard showing all cover letters with:
- Job title and company
- Status (draft, final, archived)
- Key selling points
- Last updated date
- Quick actions: Edit, Export, Delete

### Edit Page (`/cover-letters/[id]`)
Full editor with:
- Recipient information fields
- Opening paragraph editor
- Body paragraphs (add/remove/edit)
- Closing paragraph editor
- Sidebar showing AI context (key points, referenced content)
- Save and export buttons

### Integration Points
- **Resume Builder Adapt Page**: "Generate Cover Letter" button
- **Assistant Sidebar**: "Cover Letters" navigation link

## Usage Flow

### From Job Posting

1. Click "Generate Cover Letter" from cover letters page or resume adapt page
2. Select target job posting
3. AI generates tailored cover letter (~5-8 seconds)
4. Review generated content
5. Edit/refine as needed
6. Mark as final when ready
7. Export to PDF

### Editing

1. Open cover letter from dashboard
2. Edit any paragraph
3. Add/remove body paragraphs
4. Update recipient details
5. Auto-saves on blur
6. Export when ready

## Writing Strategy

The AI follows professional cover letter best practices:

### Opening Paragraph
- Shows genuine enthusiasm
- References something specific about company/role
- Establishes why you're a strong fit

**Example**: 
> "I am excited to apply for the Senior Product Manager, AI Products role at [Company]. Your focus on [specific company initiative] aligns perfectly with my experience leading AI-powered product development at Skillshare, where I drove a 25% increase in daily engagement through AI-native discovery features."

### Body Paragraphs

**Paragraph 1 - Relevant Experience**:
- Highlights 1-2 most relevant roles
- Uses specific achievements and metrics
- Connects experience to job requirements

**Paragraph 2 - Key Project**:
- Showcases impressive project
- Emphasizes outcomes and impact
- Explains relevance to target role

**Paragraph 3 - Unique Fit** (optional):
- Addresses specific requirements
- Shows cultural alignment
- Demonstrates understanding of company

### Closing Paragraph
- Reiterates enthusiasm
- Summarizes value in one sentence
- Clear call to action
- Professional tone

## Best Practices

### Content
- **Be Specific**: Use real metrics, project names, and achievements
- **Show Impact**: Focus on outcomes, not just responsibilities
- **Make Connections**: Explicitly link your experience to job requirements
- **Be Authentic**: Let your personality show through while staying professional

### Editing
- **Review AI Selections**: Check that highlighted experiences are most relevant
- **Customize Opening**: Add company-specific details you know
- **Verify Metrics**: Ensure all numbers and achievements are accurate
- **Proofread**: Check for any AI quirks or awkward phrasing

### Application Strategy
- **Generate Fresh**: Create new cover letter for each application
- **Match Tone**: Formal for corporate, enthusiastic for startups
- **Paired Submission**: Generate both resume and cover letter from same job
- **Keep Drafts**: Save versions to learn what works

## Integration with Resume Builder

The cover letter generator integrates seamlessly:

1. **Shared Portfolio**: Both use same source data (`lib/portfolio-data.ts`)
2. **Same AI Strategy**: Content selection works identically
3. **Linked Documents**: Cover letters can reference associated resumes
4. **Unified Workflow**: Generate both for same job from resume adapt page

## Export Format

HTML export includes:
- Professional letter formatting
- Your contact information (from portfolio)
- Current date
- Recipient address block
- Formal business letter layout
- Print-optimized CSS

Ready for:
- Browser print to PDF (Ctrl+P / Cmd+P)
- Copy-paste into application systems
- Email as HTML

## Tips for Success

### Do's
✅ Review and refine AI-generated content
✅ Add company-specific details you know
✅ Use metrics and specific achievements
✅ Keep it concise (3-4 paragraphs + closing)
✅ Match tone to company culture
✅ Proofread before sending

### Don'ts
❌ Send without reviewing/editing
❌ Use generic statements
❌ Copy-paste between applications
❌ Exceed one page
❌ Use overly casual language
❌ Forget to update recipient name

## Example Generated Content

### For "Senior Product Manager, AI" Role

**Opening**:
> "I am writing to express my strong interest in the Senior Product Manager, AI position at [Company]. Your commitment to building AI-powered products that enhance user experience resonates deeply with my work at Skillshare, where I currently lead company-wide AI strategy and have delivered a 25% increase in daily engagement through AI-native discovery features."

**Body (Experience)**:
> "As Lead Product Manager at Skillshare, I have driven the definition and delivery of our AI-native discovery stack, including a public ChatGPT App and semantic retrieval foundation. This work required close partnership with engineering to design vector store strategies, embedding approaches, and retrieval patterns—skills that directly align with the technical product leadership your role requires. I've demonstrated the ability to translate complex AI capabilities into user-facing products that drive measurable business outcomes."

**Body (Project)**:
> "A project I'm particularly proud of is leading the Community Feed initiative, which contributed to a 25% increase in DAU/MAU. This involved extensive quantitative analysis, behavioral modeling, and cross-functional leadership to transform fragmented community features into a coherent engagement surface. The project showcases my ability to use data-driven discovery to identify opportunities and execute on strategic product initiatives—capabilities central to the role at [Company]."

**Closing**:
> "I am excited about the opportunity to bring my experience in AI strategy, product discovery, and measurable impact to [Company]. I would welcome the chance to discuss how my background aligns with your needs and how I can contribute to your product vision. Thank you for considering my application."

## Maintenance

Keep your portfolio updated (`app/page.tsx`) with:
- Latest roles and promotions
- New projects and outcomes
- Updated metrics and achievements
- Recent certifications or awards

The cover letter generator will automatically use the latest information.

## Future Enhancements

Potential improvements:
- [ ] Multiple tone variations (A/B test)
- [ ] Industry-specific templates
- [ ] Cover letter analytics (which get responses)
- [ ] LinkedIn message generator
- [ ] Follow-up email templates
- [ ] Cultural fit scoring
- [ ] Personalization tips
- [ ] Grammar and style checking
