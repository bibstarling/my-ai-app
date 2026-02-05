# Manual Job Entry & Tailored Content Generation

## Overview

This feature allows you to manually add jobs to your tracking board from any source (LinkedIn, company websites, etc.) and generate personalized resumes and cover letters for them using AI.

## New Features

### 1. Add Jobs Manually

You can now add jobs directly to your tracking board without going through the job search feature.

**How to use:**
1. Go to "My Jobs" in the sidebar
2. Click the "Add Job Manually" button in the top-right corner
3. Fill in the job details:
   - **Job Title*** (required)
   - **Company*** (required)
   - **Location*** (required)
   - **Apply URL*** (required) - paste the application link
   - **Job Type** (Full-time, Part-time, Contract, Freelance)
   - **Salary** (optional)
   - **Job Description*** (required) - paste the full job description
4. Click "Add Job"

The job will be added to the "Saved" column in your kanban board.

**Use cases:**
- Add jobs from LinkedIn directly
- Track positions shared by your network
- Add roles from company career pages
- Keep track of jobs you found on any platform

### 2. Generate Tailored Content for Any Job

You can now generate personalized resumes and cover letters for any job in your tracking board, whether it was added manually or through job search.

**How to use:**

#### Option A: From Job Detail View
1. Click on any job card in your kanban board
2. Look for the "Tailored Content" section
3. If content hasn't been generated yet, click "Generate Tailored Content" (or "Generate Resume"/"Generate Cover Letter" if one already exists)
4. Select what you want to generate:
   - ✅ Tailored Resume
   - ✅ Cover Letter
5. Click "Generate"
6. Wait 10-30 seconds while AI creates your content
7. Once complete, preview buttons will appear

#### Option B: Generate During Manual Entry
You can also generate content immediately after adding a job (feature enhancement idea for future).

**What gets generated:**

**Tailored Resume:**
- Emphasizes relevant experience from your portfolio
- Uses keywords from the job description
- Structures content to match role requirements
- Optimized for ATS (Applicant Tracking Systems)
- Maintains authenticity while highlighting relevant skills

**Cover Letter:**
- Opens with a hook connecting to the company's mission
- Highlights 2-3 most relevant experiences
- Demonstrates understanding of the role
- Shows authentic enthusiasm
- Concise and compelling (3-4 paragraphs)

### 3. Regenerate Content

If you want to update the tailored content for a job:
- Currently, generated content persists
- To regenerate, you would need to delete the existing content (feature for future)
- Or generate the missing piece (if only resume or cover letter exists)

## User Workflows

### Workflow 1: Manual Job Entry → Generate Content
```
1. Click "Add Job Manually"
2. Paste job details from LinkedIn/website
3. Click "Add Job"
4. Click on the job card
5. Click "Generate Tailored Content"
6. Select Resume and/or Cover Letter
7. Click "Generate"
8. Preview and download generated content
9. Apply to the job
10. Update status as you progress
```

### Workflow 2: Search Jobs → Add → Generate Later
```
1. Use Job Search to find opportunities
2. Click "Create Tailored Content" (generates immediately)
3. OR just bookmark the job for later
4. Come back to My Jobs
5. Click job card → "Generate Tailored Content"
```

### Workflow 3: Update Existing Job with Missing Content
```
1. Go to My Jobs
2. Click on a job that's missing resume or cover letter
3. Click "Generate Resume" or "Generate Cover Letter"
4. Select what's missing
5. Click "Generate"
```

## Technical Details

### Database Schema
The `tracked_jobs` table already supports this feature:
- `tailored_resume_id` - References the generated resume
- `tailored_cover_letter_id` - References the generated cover letter
- Both can be `NULL` if not yet generated

### API Endpoints Used
- `POST /api/jobs/tailor-resume` - Generates tailored resume
- `POST /api/jobs/tailor-cover-letter` - Generates personalized cover letter

### State Management
- Handles loading states during generation
- Optimistic UI updates
- Error handling with user feedback
- Auto-refresh after content generation

## UI Components Added

### AddJobModal
- Form to manually enter job details
- Validation for required fields
- URL validation for apply link
- Loading state during submission

### TailorOptionsModal
- Checkbox selection for resume/cover letter
- Disables already-generated options
- Loading state during AI generation
- Clear feedback on what will be generated

### Updated Job Detail Modal
- Shows "Generate Tailored Content" button if content is missing
- Shows "Preview Resume"/"Preview Cover Letter" for existing content
- Loading spinner during generation
- Dynamic button text based on what's missing

## Benefits

### For Job Seekers
- ✅ Centralized job tracking from any source
- ✅ Generate tailored content on-demand
- ✅ Flexibility to add jobs without searching
- ✅ Better organization of application pipeline
- ✅ AI-powered personalization for every application

### For Different Use Cases
- **LinkedIn Jobs**: Copy job details and add manually
- **Company Websites**: Paste job descriptions directly
- **Referrals**: Track jobs shared by your network
- **Passive Applications**: Save interesting roles for later
- **Multiple Sources**: Unified tracking regardless of where you found the job

## Tips & Best Practices

### For Manual Job Entry
1. **Copy Full Description**: Include the complete job description for better AI tailoring
2. **Accurate Job Type**: Select the correct employment type for filtering
3. **Add Salary Info**: Helps you track compensation expectations
4. **Use Real Apply URLs**: Make applying easier when you're ready

### For Content Generation
1. **Generate Early**: Create content soon after adding to capture momentum
2. **Review Before Using**: Always review and customize AI-generated content
3. **Use Both Together**: Resume + cover letter combination is most effective
4. **Update Status**: Move to "Applied" after using the generated content

### For Tracking
1. **Add Notes**: Use the notes field for follow-up reminders (future feature)
2. **Track Dates**: System auto-tracks applied_date when status changes
3. **Clean Pipeline**: Archive old applications to keep board focused
4. **Review Content**: Re-visit generated content before each application

## Limitations & Future Enhancements

### Current Limitations
- Cannot regenerate existing content (need to manage manually)
- No bulk operations (one job at a time)
- Cannot edit job details after adding (future feature)
- No job parsing from URL (must manually copy details)

### Planned Enhancements
- [ ] Auto-fetch job details from URL
- [ ] Edit job information after adding
- [ ] Regenerate/update tailored content
- [ ] Bulk content generation for multiple jobs
- [ ] Job templates for repeated applications
- [ ] Browser extension for one-click adding
- [ ] Email integration for sending cover letters

## Troubleshooting

### Job Not Adding
- Check all required fields are filled
- Verify Apply URL is a valid URL format
- Ensure you're signed in
- Check browser console for errors

### Content Generation Failing
- Verify job description is not empty
- Check ANTHROPIC_API_KEY is configured
- Wait for any ongoing generation to complete
- Try again if timeout occurs

### Content Not Showing
- Refresh the My Jobs page
- Check if generation completed successfully
- Look for error messages in alerts
- Verify database connection

## Migration Notes

### Existing Users
- All existing tracked jobs work as before
- New features are additive, no breaking changes
- Can generate content for old jobs that don't have it
- No database migration required

### New Users
- Complete workflow available from day one
- No setup required beyond existing auth
- All features work with or without job search

## Code Changes Summary

### Files Modified
- `app/assistant/my-jobs/page.tsx` - Added manual entry and generation features

### New Components
- `AddJobModal` - Form for manual job entry
- `TailorOptionsModal` - Content generation selection dialog
- Updated job detail modal with generation controls

### New State Management
- `showAddJobModal` - Controls manual entry modal visibility
- `addingJob` - Loading state for job addition
- `tailoringJob` - Tracks which job is being processed
- `tailorOptions` - Manages content generation options

### New Functions
- `handleAddJob()` - Processes manual job submission
- `handleGenerateTailoredContent()` - Triggers AI content generation
- Reuses existing API endpoints for resume/cover letter generation

## Support

If you encounter any issues or have feature requests, please:
1. Check the console for error messages
2. Verify your API keys are configured
3. Review the troubleshooting section
4. Check GitHub issues or create a new one
