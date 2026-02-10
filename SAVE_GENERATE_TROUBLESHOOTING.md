# Save & Generate Content - Troubleshooting Guide

## Feature Overview

The "Save & Generate" button on the Job Discovery page (`/jobs/discover`) should:
1. Open a modal to select content types (Resume, Cover Letter, or both)
2. Save the job to "My Applications" (if not already saved)
3. Generate selected tailored content
4. Redirect to My Applications page

## Current Implementation

### Flow:
```
User clicks "Save & Generate" 
  ↓
openContentGenerationModal(jobId) 
  ↓
ContentGenerationModal opens
  ↓
User selects content types and clicks "Generate"
  ↓
handleGenerateContent(contentTypes)
  ↓
1. Track job (if not tracked)
2. Call /api/resume/generate (if selected)
3. Call /api/cover-letter/generate (if selected)
4. Show success modal
5. Redirect to /my-applications
```

### Code Locations:

**Button** (line 902-910):
```typescript
<button
  onClick={() => openContentGenerationModal(job.id)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
>
  Save & Generate
</button>
```

**Modal State** (lines 79-90):
```typescript
const [contentModal, setContentModal] = useState<{
  isOpen: boolean;
  jobId: string;
  jobTitle: string;
  companyName: string;
}>({
  isOpen: false,
  jobId: '',
  jobTitle: '',
  companyName: '',
});
```

**Open Function** (lines 269-279):
```typescript
function openContentGenerationModal(jobId: string) {
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;
  
  setContentModal({
    isOpen: true,
    jobId,
    jobTitle: job.normalized_title || job.title,
    companyName: job.company_name,
  });
}
```

**Handler** (lines 281-334):
```typescript
async function handleGenerateContent(contentTypes: { resume: boolean; coverLetter: boolean }) {
  const jobId = contentModal.jobId;
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;
  
  // Track the job first if not already tracked
  if (!job.is_tracked) {
    await trackJob(jobId);
  }
  
  // Generate selected content types
  const tasks: Promise<void>[] = [];
  
  if (contentTypes.resume) {
    tasks.push(
      fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      }).then(() => {})
    );
  }
  
  if (contentTypes.coverLetter) {
    tasks.push(
      fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      }).then(() => {})
    );
  }
  
  try {
    await Promise.all(tasks);
    
    showModal(
      'Content Generated!',
      `Your tailored ${contentTypes.resume && contentTypes.coverLetter ? 'resume and cover letter have' : contentTypes.resume ? 'resume has' : 'cover letter has'} been generated. View them in My Applications.`,
      'success'
    );
    
    // Navigate to applications page
    setTimeout(() => {
      window.location.href = '/my-applications';
    }, 1500);
  } catch (error) {
    showModal(
      'Generation Failed',
      'We couldn\\'t generate your content. Please try again.',
      'error'
    );
  }
}
```

**Modal Component** (lines 945-951):
```typescript
<ContentGenerationModal
  isOpen={contentModal.isOpen}
  onClose={() => setContentModal({ ...contentModal, isOpen: false })}
  jobTitle={contentModal.jobTitle}
  companyName={contentModal.companyName}
  onGenerate={handleGenerateContent}
/>
```

---

## Diagnostic Steps

### 1. Check if Modal Opens
```javascript
// In browser console, when you click "Save & Generate", check:
console.log('Modal state:', contentModal);
// Should show: { isOpen: true, jobId: '...', jobTitle: '...', companyName: '...' }
```

### 2. Check if Generate Button is Clicked
```javascript
// The ContentGenerationModal should log when button is clicked
// Check browser console for errors
```

### 3. Check API Responses
```javascript
// Open Network tab in DevTools
// Click "Save & Generate" → select options → click "Generate"
// Look for requests to:
// - POST /api/jobs/{jobId}/track (should succeed: 200)
// - POST /api/resume/generate (should be called if resume selected)
// - POST /api/cover-letter/generate (should be called if cover letter selected)
```

### 4. Check for JavaScript Errors
- Open DevTools (F12)
- Go to Console tab
- Click "Save & Generate"
- Look for any red error messages

---

## Common Issues & Solutions

### Issue 1: Modal Doesn't Open
**Symptoms**: Clicking button does nothing

**Possible Causes**:
- `jobs` array is empty or job not found
- Event handler not attached

**Solution**:
```typescript
// Add debugging:
function openContentGenerationModal(jobId: string) {
  console.log('Opening modal for job:', jobId);
  const job = jobs.find(j => j.id === jobId);
  console.log('Found job:', job);
  if (!job) {
    console.error('Job not found!');
    return;
  }
  
  setContentModal({
    isOpen: true,
    jobId,
    jobTitle: job.normalized_title || job.title,
    companyName: job.company_name,
  });
}
```

### Issue 2: Generate Button Doesn't Work
**Symptoms**: Modal opens but clicking "Generate" does nothing

**Check**:
- Is at least one checkbox selected?
- Check ContentGenerationModal component for errors
- Check browser console

**Solution**: The button is disabled if neither checkbox is selected:
```typescript
disabled={isGenerating || (!selectedTypes.resume && !selectedTypes.coverLetter)}
```

### Issue 3: API Calls Fail
**Symptoms**: Generation starts but fails

**Check Network Tab**:
- Status codes (should be 200)
- Response body for error messages

**Common Errors**:
- 401: Not authenticated
- 403: Missing profile data
- 500: Server error

### Issue 4: Silent Failure
**Symptoms**: Button works but nothing happens

**Check**:
```typescript
// In handleGenerateContent, add logging:
async function handleGenerateContent(contentTypes) {
  console.log('Starting generation:', contentTypes);
  
  try {
    await Promise.all(tasks);
    console.log('Generation successful!');
  } catch (error) {
    console.error('Generation failed:', error);
    // Modal should show error
  }
}
```

---

## Testing the Flow

1. **Go to Job Discovery**:
   ```
   http://localhost:3002/jobs/discover
   ```

2. **Search for jobs** (click "Discover Jobs")

3. **Find a job** and click "Save & Generate"

4. **Expected**: Modal opens with:
   - Job title and company name
   - Two checkboxes (both checked by default)
   - Estimated time
   - Generate button

5. **Select content** (Resume, Cover Letter, or both)

6. **Click "Generate"**

7. **Expected**:
   - Button shows "Generating..." with spinner
   - Wait 30-90 seconds
   - Success modal appears
   - Redirects to `/my-applications`

---

## Debug Mode

Add this temporarily to see what's happening:

```typescript
// At the top of JobDiscoveryPage component
useEffect(() => {
  console.log('Content Modal State:', contentModal);
}, [contentModal]);

// In openContentGenerationModal
function openContentGenerationModal(jobId: string) {
  console.log('[DEBUG] Opening modal for job:', jobId);
  const job = jobs.find(j => j.id === jobId);
  console.log('[DEBUG] Job found:', job);
  
  if (!job) {
    console.error('[DEBUG] Job not found in jobs array!');
    return;
  }
  
  const newState = {
    isOpen: true,
    jobId,
    jobTitle: job.normalized_title || job.title,
    companyName: job.company_name,
  };
  console.log('[DEBUG] Setting modal state:', newState);
  setContentModal(newState);
}

// In handleGenerateContent
async function handleGenerateContent(contentTypes: { resume: boolean; coverLetter: boolean }) {
  console.log('[DEBUG] handleGenerateContent called with:', contentTypes);
  console.log('[DEBUG] Current jobId:', contentModal.jobId);
  
  const jobId = contentModal.jobId;
  const job = jobs.find(j => j.id === jobId);
  
  if (!job) {
    console.error('[DEBUG] Job not found!');
    return;
  }
  
  console.log('[DEBUG] Job found:', job);
  console.log('[DEBUG] Is tracked?', job.is_tracked);
  
  if (!job.is_tracked) {
    console.log('[DEBUG] Tracking job...');
    await trackJob(jobId);
  }
  
  console.log('[DEBUG] Preparing API calls...');
  const tasks: Promise<void>[] = [];
  
  if (contentTypes.resume) {
    console.log('[DEBUG] Adding resume generation');
    tasks.push(
      fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      }).then(res => {
        console.log('[DEBUG] Resume API response:', res.status);
        return res.json();
      }).then(data => {
        console.log('[DEBUG] Resume API data:', data);
      })
    );
  }
  
  if (contentTypes.coverLetter) {
    console.log('[DEBUG] Adding cover letter generation');
    tasks.push(
      fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      }).then(res => {
        console.log('[DEBUG] Cover letter API response:', res.status);
        return res.json();
      }).then(data => {
        console.log('[DEBUG] Cover letter API data:', data);
      })
    );
  }
  
  try {
    console.log('[DEBUG] Executing API calls...');
    await Promise.all(tasks);
    console.log('[DEBUG] All API calls completed successfully');
    
    showModal(
      'Content Generated!',
      `Your tailored content has been generated.`,
      'success'
    );
    
    setTimeout(() => {
      console.log('[DEBUG] Redirecting to /my-applications');
      window.location.href = '/my-applications';
    }, 1500);
  } catch (error) {
    console.error('[DEBUG] Generation failed:', error);
    showModal(
      'Generation Failed',
      'We couldn\'t generate your content. Please try again.',
      'error'
    );
  }
}
```

---

## Next Steps

1. **Open the page** with DevTools Console open (F12)
2. **Click "Save & Generate"** on any job
3. **Check the console** for `[DEBUG]` messages
4. **Share the console output** so I can see exactly where it's failing

The implementation looks correct, so we need to see the actual runtime behavior to identify the issue.
