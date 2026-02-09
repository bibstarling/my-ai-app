# Profile System Testing Guide

## ✅ What Was Fixed

1. **Database**: Added `markdown TEXT` column to `user_portfolios` table
2. **API Routes**: All routes now properly use markdown for personalization
3. **Global Assistant**: Updated to use profile markdown for context
4. **Documentation**: Complete system architecture documented

---

## 🧪 Testing Steps

### 1. Test Profile Saving (CRITICAL)

**Steps:**
1. Open your browser
2. Go to `http://localhost:3000/portfolio/builder` (or your dev URL)
3. You should see a Notion-like editor with some initial markdown content
4. Add some text to the editor, for example:
   ```markdown
   ## About Me
   I'm a Lead Product Manager with 8+ years of experience building AI products.
   
   ## Experience
   ### Lead Product Manager at Skillshare
   *2021 - Present* | Remote
   - Drove AI strategy and shipped ChatGPT App
   - Increased engagement by 25%
   ```
5. Click the **Save** button in the top right
6. **Check browser console** (F12 → Console tab)
   - ✅ Should see no errors
   - ✅ Should see confirmation that save succeeded
7. Refresh the page (F5)
8. **Verify**: Your content should still be there

**If it fails:**
- Check browser console for errors
- Check browser Network tab (F12 → Network) for failed requests
- Look for POST to `/api/portfolio/update` - should return 200 status

---

### 2. Test AI Assistant (Add to Profile)

**Steps:**
1. On the portfolio builder page, click **"Add to Profile"** button (bottom right)
2. A chat panel should open on the right side
3. Try uploading a file:
   - Click the **Upload** button
   - Select a PDF (like your resume) or an image
   - Wait for it to process
   - You should see a message confirming the file was attached
4. Type a message like: "Extract the key information from this resume"
5. Press Send or hit Enter
6. **Wait for AI response** (may take 5-15 seconds)
7. The AI should:
   - Analyze your file
   - Extract information
   - Update the markdown in the editor
   - Show you what it added
8. **Verify**: The markdown editor should now have new content
9. Click **Save** to persist the changes

**If it fails:**
- Check if you have an API key configured (Settings → API Configuration)
- Check browser console for errors
- Verify the file upload completed successfully

---

### 3. Test URL Scraping

**Steps:**
1. With the AI assistant panel open (click "Add to Profile" if closed)
2. Paste a URL in the input field, for example:
   - Your LinkedIn profile URL
   - Your GitHub profile URL
   - A project website
3. Press Send
4. You should see messages:
   - "🔍 Found 1 URL(s). Scraping content..."
   - "✅ Scraping complete! Adding content directly to your profile..."
5. The scraped content should be added to your markdown **automatically**
6. Scroll through the editor to see the new content
7. Click **Save** to keep the changes

**Optional: AI Processing Mode**
- Type: "analyze this with AI: https://linkedin.com/in/yourprofile"
- This will use AI to extract and format the content instead of direct paste

**If it fails:**
- Check that the URL is accessible (not behind login)
- Some websites block scraping - try a different URL
- Check browser console for errors

---

### 4. Test Resume Generation with Profile

**Steps:**
1. Make sure you've saved some content to your profile (from steps above)
2. Go to **Dashboard** or **Job Search** page
3. Find a job listing (or search for jobs)
4. Click on a job to see details
5. Click **"Generate Resume"** or similar button
6. Wait for resume generation (5-15 seconds)
7. **Verify**: 
   - Resume should be generated
   - Should use content from YOUR profile
   - Should be tailored to the job you selected
8. Check the resume sections:
   - Summary should reference your actual experience
   - Experience section should include your real jobs
   - Skills should match what you added to your profile

**Expected behavior:**
- Resume content should be SPECIFIC to you
- Should NOT be generic template content
- Should reference your actual achievements, companies, projects

**If it fails:**
- Check if your profile has enough content (need at least Experience and Skills)
- Check browser console for errors
- Verify API key is configured or you're within free tier limits

---

### 5. Test Cover Letter Generation

**Steps:**
1. Go to a job listing
2. Click **"Generate Cover Letter"**
3. Wait for generation (5-15 seconds)
4. **Verify**:
   - Cover letter should be personalized
   - Should reference your actual experience
   - Should mention specific projects/achievements from your profile
   - Should sound like it was written for THIS specific job
5. Read through the letter - it should:
   - Open with enthusiasm about the specific company/role
   - Mention YOUR actual work experience
   - Reference YOUR projects with real details
   - Sound conversational and human (not robotic)

**Expected behavior:**
- Highly personalized to your background
- Specific details from your profile
- Tailored to the job requirements

**If it fails:**
- Ensure your profile has detailed content
- Check API key configuration
- Look for errors in browser console

---

### 6. Test Career Coach Chat

**Steps:**
1. Go to **Assistant → Chat** page (or wherever the career coach is)
2. Type a message like: "What career moves should I consider next?"
3. Wait for response
4. **Verify**:
   - AI should reference YOUR specific background
   - Should mention your actual experience (e.g., "Given your 8 years at Skillshare...")
   - Should give advice based on YOUR skill set
   - Should feel personalized, not generic

**Try these prompts:**
- "What skills should I develop based on my background?"
- "What types of companies would be a good fit for me?"
- "How can I position myself for senior roles?"

**Expected behavior:**
- Every response should reference your actual profile
- Advice should be specific to your situation
- Should NOT give generic career advice

**If it fails:**
- Verify your profile has content
- Check browser console
- Ensure the chat API is working

---

### 7. Test Global AI Assistant

**Steps:**
1. Click the **AI Assistant** button (usually bottom right corner, available on most pages)
2. Try these commands:
   - "Help me find remote PM jobs"
   - "What should I add to my profile?"
   - "Give me tips for my next interview"
3. **Verify**:
   - Responses should acknowledge your background
   - Should provide contextual help
   - May trigger actions (like navigating to job search)

**Expected behavior:**
- Context-aware assistance
- References your profile when relevant
- Helpful and action-oriented

---

## 🔍 Common Issues & Solutions

### Issue: Save button does nothing

**Solution:**
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed POST to `/api/portfolio/update`
4. Common causes:
   - Not logged in (check authentication)
   - Database connection issue
   - API route error

### Issue: AI responses are generic (don't reference my profile)

**Solution:**
1. Check if profile markdown has content:
   - Go to `/portfolio/builder`
   - Verify you see your content
   - Click Save to ensure it persists
2. Check if markdown is actually saved in database:
   - Open browser console
   - Run: `fetch('/api/portfolio/current', {credentials: 'include'}).then(r => r.json()).then(d => console.log(d.portfolio.markdown))`
   - Should see your markdown content, not `null` or `undefined`
3. If markdown is empty or null:
   - Database migration may not have applied
   - Try saving your profile again

### Issue: File upload fails

**Solution:**
1. Check file size (max ~10MB usually)
2. Check file type (PDF, images, .txt, .md supported)
3. Look for errors in console
4. Verify storage is configured correctly

### Issue: URL scraping returns empty content

**Solution:**
1. Some sites block scraping (LinkedIn often does)
2. Try a different URL (personal website, GitHub, public portfolio)
3. If site requires login, scraping won't work
4. Check browser console for specific error

### Issue: API key errors / rate limits

**Solution:**
1. Go to **Settings → API Configuration**
2. Add your own Anthropic API key (or OpenAI/Groq)
3. This gives you unlimited usage (you pay directly)
4. Or wait for system rate limit to reset (monthly)

---

## ✅ Success Criteria

After testing, you should be able to:

- [x] Save markdown content to your profile
- [x] Upload files and have AI extract content
- [x] Paste URLs and scrape content
- [x] See content persist after page refresh
- [x] Generate resumes that reference YOUR profile
- [x] Generate cover letters with YOUR details
- [x] Chat with career coach and get personalized advice
- [x] Use global assistant with contextual help

---

## 📊 Verification Queries

Run these in browser console to check system state:

### Check if markdown column exists and has data
```javascript
fetch('/api/portfolio/current', {credentials: 'include'})
  .then(r => r.json())
  .then(d => {
    console.log('Has markdown column:', 'markdown' in d.portfolio);
    console.log('Markdown length:', d.portfolio.markdown?.length || 0);
    console.log('First 200 chars:', d.portfolio.markdown?.slice(0, 200));
  });
```

### Verify authentication
```javascript
fetch('/api/portfolio/current', {credentials: 'include'})
  .then(r => r.json())
  .then(d => {
    console.log('Auth status:', d.success ? 'Authenticated' : 'Not authenticated');
    console.log('Portfolio exists:', !!d.portfolio);
  });
```

### Check API configuration
```javascript
fetch('/api/settings/api-config', {credentials: 'include'})
  .then(r => r.json())
  .then(d => {
    console.log('Has user API key:', !!d.config);
    console.log('Using:', d.config ? 'User API key' : 'System API (with limits)');
  });
```

---

## 🎉 Next Steps

Once all tests pass:

1. **Build your profile comprehensively**
   - Add all work experience with metrics
   - Include key projects with outcomes
   - List all relevant skills
   - Add education and certifications
   - Include any awards or recognition

2. **Keep it updated**
   - Add new achievements as they happen
   - Update skills as you learn them
   - Document completed projects

3. **Use AI features**
   - Generate tailored resumes for jobs
   - Create personalized cover letters
   - Get career coaching based on your background

4. **Iterate and improve**
   - The more detailed your profile, the better your AI-generated content
   - Review AI output and update profile if something is missing
   - Refine based on results

---

## 🆘 Need Help?

If you're stuck:

1. Check browser console for errors (F12)
2. Check Network tab for failed requests
3. Review PROFILE_SYSTEM_COMPLETE.md for architecture details
4. Check API key configuration in Settings
5. Verify you're on the latest code (database migration applied)

**Database verification:**
- Open Supabase dashboard
- Go to Table Editor → user_portfolios
- Find your row
- Check if `markdown` column exists and has content

If markdown column is missing, run:
```sql
ALTER TABLE user_portfolios
ADD COLUMN IF NOT EXISTS markdown TEXT;
```

This guide should help you verify the entire profile system is working correctly! 🚀
