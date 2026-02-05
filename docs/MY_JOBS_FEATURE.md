# My Jobs Feature - Job Tracking & Tailored Content

## Overview

A comprehensive job tracking system with AI-powered tailored content generation. Track your job applications through a kanban board interface and generate custom resumes and cover letters for each position.

## Features Implemented

### 1. **Job Search with Tailored Content**
- Each job result card now includes a "Create Tailored Content" button
- Select which content to generate: Resume and/or Cover Letter
- AI generates job-specific content based on your portfolio
- Jobs are automatically saved to "My Jobs" when content is created

### 2. **My Jobs Kanban Board**
- Visual kanban board with 6 status columns:
  - **Saved**: Jobs you've saved for later
  - **Applied**: Jobs you've applied to
  - **Interview**: Interview scheduled/completed
  - **Offer**: Received an offer
  - **Rejected**: Application rejected
  - **Archived**: Old applications
- Drag and drop jobs between columns (using dropdown)
- Click any job card to view full details
- Badge indicators show which content has been generated (Resume/Cover Letter)

### 3. **AI-Powered Tailored Content**
- **Tailored Resumes**: AI analyzes the job description and optimizes your resume
  - Emphasizes relevant experience from your portfolio
  - Uses keywords from the job description
  - Structures content to match role requirements
  - Maintains authenticity while optimizing for ATS
- **Custom Cover Letters**: AI writes personalized cover letters
  - Connects to company mission and role requirements
  - Highlights 2-3 most relevant experiences
  - Uses your authentic PM voice and style
  - Concise and compelling (3-4 paragraphs)

### 4. **Navigation Updates**
- Left sidebar is always visible with all tools
- New "My Jobs" section with kanban icon
- "Job scraping" renamed to "Job Search" for clarity

## Database Schema

### `tracked_jobs` Table
```sql
- id: UUID (primary key)
- user_id: UUID (references users)
- title, company, location, job_type
- salary, posted_date, description
- apply_url, skills[]
- status: saved | applied | interview | offer | rejected | archived
- tailored_resume_id: UUID (references resumes)
- tailored_cover_letter_id: UUID (references cover_letters)
- notes, applied_date, interview_date
- created_at, updated_at
```

## API Endpoints

### `POST /api/jobs/tailor-resume`
Generates a tailored resume for a specific job.

**Request Body:**
```json
{
  "jobDescription": "Full job description text",
  "jobTitle": "Product Manager",
  "company": "Company Name"
}
```

**Response:**
```json
{
  "success": true,
  "resumeId": "uuid",
  "resume": { /* resume object */ }
}
```

### `POST /api/jobs/tailor-cover-letter`
Generates a personalized cover letter for a specific job.

**Request Body:**
```json
{
  "jobDescription": "Full job description text",
  "jobTitle": "Product Manager",
  "company": "Company Name"
}
```

**Response:**
```json
{
  "success": true,
  "coverLetterId": "uuid",
  "coverLetter": { /* cover letter object */ }
}
```

## User Flow

### 1. Search for Jobs
1. Go to "Job Search" in the left sidebar
2. Upload your resume (optional) or use portfolio data
3. Set filters (location, remote, employment type, etc.)
4. Click "Find jobs matching my resume"

### 2. Create Tailored Content
1. Browse job results
2. Click "Create Tailored Content" on any job card
3. Select what to generate:
   - ✅ Tailored Resume
   - ✅ Cover Letter
4. Click "Create & Save Job"
5. AI generates content (takes ~10-30 seconds)
6. Job is automatically saved to "My Jobs"

### 3. Track Applications
1. Go to "My Jobs" in the left sidebar
2. View your jobs organized by status
3. Click any job card to see full details
4. View generated resume and cover letter (links open in new tabs)
5. Change job status using the dropdown in each card
6. Click "Apply to Job" to visit the application URL

### 4. Manage Your Pipeline
- Move jobs through your pipeline as they progress
- Update status from "Saved" → "Applied" → "Interview" → "Offer"
- Mark unsuccessful applications as "Rejected"
- Archive old applications to keep your board clean
- Access your tailored content anytime from the job detail modal

## Files Modified/Created

### New Files
- `supabase/migrations/20260205_create_tracked_jobs.sql` - Database schema
- `app/api/jobs/tailor-resume/route.ts` - Resume generation API
- `app/api/jobs/tailor-cover-letter/route.ts` - Cover letter generation API
- `docs/MY_JOBS_FEATURE.md` - This documentation

### Modified Files
- `app/assistant/page.tsx` - Added My Jobs kanban board and tailored content UI

## Next Steps (Optional Enhancements)

1. **Drag and Drop**: Implement native drag-and-drop between kanban columns
2. **Notes**: Add ability to add notes to each job card
3. **Reminders**: Set follow-up reminders for applications
4. **Email Integration**: Send cover letters directly via email
5. **Application Timeline**: Visual timeline of application progress
6. **Bulk Actions**: Select multiple jobs and change status at once
7. **Export**: Export all tracked jobs to CSV/Excel
8. **Analytics**: Dashboard showing application success rate, avg time to offer, etc.

## Testing the Feature

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Apply the database migration**:
   - Go to your Supabase project
   - Run the SQL in `supabase/migrations/20260205_create_tracked_jobs.sql`

3. **Test the workflow**:
   - Navigate to `/assistant`
   - Search for jobs in "Job Search"
   - Click "Create Tailored Content" on a job
   - Go to "My Jobs" to see your tracked application
   - Click the job card to view details and access generated content

## Troubleshooting

### Jobs not saving
- Check that the database migration was applied successfully
- Verify Supabase connection in browser console
- Ensure user is authenticated (or in dev mode)

### Content generation failing
- Check that `ANTHROPIC_API_KEY` is set in `.env.local`
- Verify the API key is valid and has credits
- Check browser console for detailed error messages

### Kanban board not loading
- Verify the `tracked_jobs` table exists in Supabase
- Check Row Level Security (RLS) policies are enabled
- Ensure user_id matches the authenticated user

## Technical Notes

- **Authentication**: Works with or without Clerk (dev mode fallback)
- **AI Model**: Uses Claude Sonnet 4 for content generation
- **Database**: Supabase with Row Level Security
- **Real-time**: Could be enhanced with Supabase real-time subscriptions
- **Status Updates**: Automatically tracks `applied_date` when status changes to "applied"
