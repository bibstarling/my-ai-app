# Match Calculation - Debugging & Manual Trigger

## Issue Resolution

The automatic match calculation has been enhanced with:
1. ✅ Better error handling and logging
2. ✅ User feedback on success/failure
3. ✅ Manual "Calculate Match" button as backup
4. ✅ Detailed console logging for debugging
5. ✅ More robust error recovery
6. ✅ Race condition fix with 500ms delay after match calculation
7. ✅ Modal state synchronization for immediate UI updates

## New Features

### 1. Manual "Calculate Match" Button

**Location:** Job detail modal (when you click on a job card)

**Appears when:**
- Job has tailored resume and/or cover letter
- Shows next to Preview Resume/Cover Letter buttons

**Button Text:**
- "Calculate Match" (if no match exists)
- "Recalculate Match" (if match already exists)

**Usage:**
```
1. Click on any job card
2. In the modal, look for "Calculate Match" button
3. Click it
4. Wait ~5 seconds
5. Match percentage appears
6. Alert shows: "Match calculated: 87% - Strong Match"
```

### 2. Enhanced Logging

**Console Logs Show:**
```
[Match Calculation] Starting...
[Match Calculation] Job ID: abc123 User ID: user_xyz
[Match Calculation] Fetching job from database...
[Match Calculation] Job found: Senior Product Manager at Google
[Match Calculation] Resume ID: resume_123 Cover Letter ID: cl_456
[Match Calculation] Fetching resume: resume_123
[Match Calculation] Resume found with 6 sections
[Match Calculation] Fetching cover letter: cl_456
[Match Calculation] Cover letter found
[Match Calculation] Calling Claude API...
[Match Calculation] Resume content length: 2456
[Match Calculation] Cover letter content length: 892
[Match Calculation] AI response received
[Match Calculation] Parsed match data: {percentage: 87, ...}
[Match Calculation] Final percentage: 87
[Match Calculation] Updating database with percentage: 87
[Match Calculation] Successfully saved match percentage to database
Match percentage calculated: 87%
```

### 3. Better Error Messages

**If match calculation fails:**
```javascript
// Old: Silent failure, generic console warning
// New: Detailed error in console + user alert

Error types:
- "Unauthorized" → Check if logged in
- "Job not found" → Verify job exists
- "No tailored content found" → Generate content first
- "Database error" → Check Supabase connection
- "AI error" → Check ANTHROPIC_API_KEY
```

## Debugging Checklist

### If Match Not Calculating Automatically

**Step 1: Check Browser Console**
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. Generate tailored content
4. Look for "[Match Calculation]" logs
5. Check for any error messages
```

**Step 2: Verify Prerequisites**
```
✅ Job has tailored resume OR cover letter
✅ User is logged in (Clerk authenticated)
✅ ANTHROPIC_API_KEY is set in environment
✅ Supabase connection is working
✅ Internet connection is active
```

**Step 3: Check Database**
```sql
-- Verify job exists
SELECT id, title, company, tailored_resume_id, tailored_cover_letter_id 
FROM tracked_jobs 
WHERE id = 'your-job-id';

-- Verify resume exists
SELECT id, clerk_id FROM resumes WHERE id = 'resume-id';

-- Verify cover letter exists
SELECT id, clerk_id FROM cover_letters WHERE id = 'cover-letter-id';
```

**Step 4: Try Manual Trigger**
```
1. Go to My Jobs
2. Click on the job card
3. Click "Calculate Match" button
4. Watch console for detailed logs
5. Check if match appears after calculation
```

### Common Issues & Solutions

#### Issue 1: "No tailored content found"
**Cause:** Job doesn't have resume or cover letter
**Solution:**
```
1. Click "Generate Tailored Content"
2. Select Resume and/or Cover Letter
3. Wait for generation to complete
4. Match should calculate automatically
5. If not, use "Calculate Match" button
```

#### Issue 2: Match calculation silent failure
**Cause:** API error being swallowed
**Solution:**
```
1. Check browser console for error details
2. Look for "[Match Calculation]" logs
3. Note where the process stops
4. Check corresponding service (database, AI, etc.)
5. Use manual "Calculate Match" button
```

#### Issue 3: "Unauthorized" error
**Cause:** Not logged in or session expired
**Solution:**
```
1. Refresh page
2. Sign in again if needed
3. Try generating content again
```

#### Issue 4: Database update fails
**Cause:** Supabase connection or schema issue
**Solution:**
```
1. Verify Supabase is accessible
2. Check if migration was applied:
   ALTER TABLE tracked_jobs ADD COLUMN match_percentage INTEGER;
3. Run migration if needed
4. Try manual calculation
```

#### Issue 5: AI timeout
**Cause:** Large content or API slowness
**Solution:**
```
1. Wait longer (up to 15 seconds)
2. Check ANTHROPIC_API_KEY is valid
3. Retry with manual button
4. Check API rate limits
```

## How to Verify It's Working

### Test Flow

**Step-by-step test:**
```
1. Go to Job Search or My Jobs
2. Add a job (or use existing)
3. Click "Generate Tailored Content"
4. Select Resume and Cover Letter
5. Click "Generate"
6. Watch browser console:
   - Should see "Starting match calculation for job: xyz"
   - Should see "[Match Calculation] Starting..."
   - Should see "[Match Calculation] Final percentage: 87"
   - Should see "Match percentage calculated: 87%"
7. After alert dismissal, refresh page
8. Job card should show "✓ 87% Match" badge
9. Click job card → Match should appear in detail modal
```

**If automatic fails:**
```
1. Open browser console (F12) to check for error messages
2. Click on job card in My Jobs
3. Look for "Calculate Match" button next to tailored content
4. Click it
5. Watch console logs for detailed debugging information
6. Match should appear after ~5 seconds
7. Alert confirms: "Match calculated: 87% - Strong Match"
8. No page refresh needed - match appears immediately
```

## Manual Trigger Button

### Location
**Job Detail Modal → Tailored Content Section**

### Appearance
```
┌─────────────────────────────────────┐
│ Tailored Content                   │
│                                     │
│ [Preview Resume]                    │
│ [Preview Cover Letter]              │
│ [Calculate Match] ← Manual trigger  │
└─────────────────────────────────────┘
```

### States
**Before calculation:**
```
[✨ Calculate Match]
```

**During calculation:**
```
[⏳ Calculating...]
```

**If match exists:**
```
[✨ Recalculate Match]
```

### Benefits
- **Backup option** if automatic fails
- **Force recalculation** if needed
- **Debug tool** with detailed console output
- **User control** over when to calculate

## Console Output Examples

### Successful Calculation
```
Starting match calculation for job: 550e8400-e29b-41d4-a716-446655440000
[Match Calculation] Starting...
[Match Calculation] Job ID: 550e8400-e29b-41d4-a716-446655440000 User ID: user_2abc123
[Match Calculation] Fetching job from database...
[Match Calculation] Job found: Senior Product Manager at Google
[Match Calculation] Resume ID: resume_789 Cover Letter ID: cl_456
[Match Calculation] Fetching resume: resume_789
[Match Calculation] Resume found with 6 sections
[Match Calculation] Fetching cover letter: cl_456
[Match Calculation] Cover letter found
[Match Calculation] Calling Claude API...
[Match Calculation] Resume content length: 2456
[Match Calculation] Cover letter content length: 892
[Match Calculation] AI response received
[Match Calculation] Parsed match data: {
  percentage: 87,
  reasoning: "Strong keyword match...",
  strengths: [...],
  gaps: [...]
}
[Match Calculation] Final percentage: 87
[Match Calculation] Updating database with percentage: 87
[Match Calculation] Successfully saved match percentage to database
Match percentage calculated: 87%
```

### Failed Calculation
```
Starting match calculation for job: 550e8400-e29b-41d4-a716-446655440000
[Match Calculation] Starting...
[Match Calculation] Job ID: 550e8400-e29b-41d4-a716-446655440000 User ID: user_2abc123
[Match Calculation] Fetching job from database...
[Match Calculation] Job found: Senior Product Manager at Google
[Match Calculation] Resume ID: resume_789 Cover Letter ID: null
[Match Calculation] Fetching resume: resume_789
[Match Calculation] Error fetching resume: {code: "PGRST116", message: "..."}
Error calculating match percentage: Database error
```

## Improved Error Handling

### Frontend (My Jobs Page)

**Better feedback:**
```typescript
// Old: Silent console.warn
console.warn('Could not calculate match percentage:', matchErr);

// New: Detailed logging + user feedback
console.error('Error calculating match percentage:', matchErr);
const message = matchCalculated 
  ? 'Tailored content generated and match calculated successfully!'
  : 'Tailored content generated! (Match calculation pending - refresh to see score)';
alert(message);
```

### Backend (API)

**Detailed logging:**
```typescript
// Logs at every step
console.log('[Match Calculation] Starting...');
console.log('[Match Calculation] Job found:', job.title);
console.log('[Match Calculation] Calling Claude API...');
console.log('[Match Calculation] Successfully saved to database');

// Better error messages
if (jobError) {
  console.error('[Match Calculation] Database error:', jobError);
  return NextResponse.json({ error: `Database error: ${jobError.message}` });
}
```

## Migration Check

### Verify Database Schema

**Run this to check if column exists:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracked_jobs' 
AND column_name = 'match_percentage';
```

**If empty, run migration:**
```sql
ALTER TABLE tracked_jobs 
ADD COLUMN IF NOT EXISTS match_percentage INTEGER 
CHECK (match_percentage >= 0 AND match_percentage <= 100);
```

## Testing Guide

### Test Automatic Calculation

1. **Clear existing match** (if any):
   ```sql
   UPDATE tracked_jobs 
   SET match_percentage = NULL 
   WHERE id = 'test-job-id';
   ```

2. **Open browser console** (F12)

3. **Generate tailored content:**
   - Click "Generate Tailored Content"
   - Select Resume and/or Cover Letter
   - Click "Generate"

4. **Watch console output:**
   - Should see "Starting match calculation..."
   - Should see all "[Match Calculation]" logs
   - Should see "Match percentage calculated: X%"

5. **Verify in UI:**
   - Refresh page
   - Check job card has match badge
   - Click card, verify match in modal

### Test Manual Trigger

1. **Open job card** with tailored content

2. **Click "Calculate Match"** button

3. **Watch console** for detailed logs

4. **Verify result:**
   - Alert shows percentage
   - Badge appears on card
   - Match visible in modal

## Environment Variables Check

**Required:**
```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Verify:**
```bash
# In terminal
echo $ANTHROPIC_API_KEY
# Should show your API key

# Or in Node.js console
console.log(process.env.ANTHROPIC_API_KEY);
```

## Quick Fix Commands

### If stuck, try these:

**1. Restart dev server:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

**2. Clear browser cache:**
```
Ctrl+Shift+Delete → Clear cached files
```

**3. Force recalculate all jobs:**
```sql
-- Reset all matches
UPDATE tracked_jobs SET match_percentage = NULL;

-- Then use manual button for each job
```

**4. Check API endpoint directly:**
```bash
# Using curl (replace values)
curl -X POST http://localhost:3000/api/jobs/calculate-match \
  -H "Content-Type: application/json" \
  -d '{"jobId":"your-job-uuid"}'
```

## Timing Improvements

### Race Condition Fix

The system now includes timing improvements to prevent race conditions:

**What was happening:**
- Match calculated and saved to database
- UI refreshed immediately before database commit finalized
- Match percentage not visible until page reload

**Fix applied:**
```typescript
// After match calculation completes
await new Promise(resolve => setTimeout(resolve, 500));

// Then reload jobs and update UI
await loadJobs();

// Update modal state if open
if (selectedJob?.id === jobId) {
  const { data: updatedJob } = await supabase
    .from('tracked_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  
  if (updatedJob) {
    setSelectedJob(updatedJob);
  }
}
```

**Result:**
- Match percentage appears immediately in UI
- No need to manually refresh page
- Job detail modal shows match instantly

## Summary

### What's Fixed

✅ **Enhanced error handling** - No more silent failures
✅ **Detailed logging** - Track every step in console
✅ **User feedback** - Know if match calculated or failed
✅ **Manual trigger** - "Calculate Match" button as backup
✅ **Better debugging** - Console shows exactly what's happening
✅ **Race condition fix** - 500ms delay ensures database is synced
✅ **Modal state sync** - Job detail modal updates immediately

### How to Use

**Automatic (Default):**
1. Generate tailored content
2. Wait for "Match calculated successfully!" message
3. If it says "pending", use manual button

**Manual (Backup):**
1. Click on job card
2. Click "Calculate Match" button
3. Wait ~5 seconds
4. Match appears automatically

### Debugging

**Always check console:**
- Open DevTools (F12)
- Watch for "[Match Calculation]" logs
- Note any errors
- Share error details if asking for help

**If issues persist:**
1. Check console for specific error
2. Verify database migration applied
3. Check environment variables
4. Try manual button
5. Restart dev server

The manual button ensures you can always calculate match even if automatic fails!
