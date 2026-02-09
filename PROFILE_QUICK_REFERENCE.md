# Professional Profile - Quick Reference Card

## 🚨 WHAT WAS BROKEN

**Symptom**: Profile markdown failing to save
**Root Cause**: `markdown` column missing from database
**Status**: ✅ **FIXED** - Column added, system fully functional

---

## ⚡ Quick Test (2 minutes)

```bash
1. Go to /portfolio/builder
2. Type some text in the editor
3. Click Save button (top right)
4. Refresh page (F5)
5. ✅ Text should still be there
```

**If text disappears** → Check browser console (F12) for errors

---

## 🎯 The Profile System in 30 Seconds

### What It Is
**Your professional profile in markdown format** - the single source of truth for ALL personalized AI content.

### What It Powers
- ✅ AI-generated resumes
- ✅ AI-generated cover letters
- ✅ Career coaching chat
- ✅ Global AI assistant
- ✅ Job matching

### How It Works
```
You type/upload content → Click Save → Markdown stored in DB → All AI features use it
```

---

## 📝 Building Your Profile (30-60 min)

### Recommended Structure

```markdown
# Your Name

## About Me
2-3 sentence professional summary

## Experience
### Job Title at Company
*Dates* | Location
- Achievement with metrics
- Key projects
- Technologies used

## Projects
### Project Name
What you built and the impact
**Technologies:** Tech stack
**Outcome:** Results

## Skills
**Technical:** Languages, frameworks, tools
**Product:** PM skills
**Leadership:** Soft skills

## Education
**Degree** - University (Year)

## Certifications
- Cert Name (Issuer, Date)
```

### Pro Tips
- ✅ Use specific metrics (25% increase, $500K revenue)
- ✅ Include real project/product names
- ✅ List actual technologies used
- ✅ More detail = better AI outputs
- ✅ Save frequently (Ctrl+S)

---

## 🤖 Using the AI Assistant

### 3 Ways to Add Content

**1. Direct Typing**
- Type in the editor
- Use `/` for commands (headings, lists, etc.)
- Use Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link)

**2. Upload Files**
- Click "Add to Profile" button
- Upload PDF, images, documents
- AI extracts information
- Review & Save

**3. Scrape URLs**
- Click "Add to Profile" button
- Paste LinkedIn, GitHub, portfolio URL
- Default: Direct paste (no AI)
- Optional: Say "analyze with AI" for AI processing
- Review & Save

---

## 🔧 Technical Details

### Database Schema
```sql
user_portfolios (
  id UUID,
  clerk_id TEXT,
  markdown TEXT,  -- ← THE KEY COLUMN
  portfolio_data JSONB,
  status portfolio_status,
  is_public BOOLEAN,
  ...
)
```

### API Routes Using Markdown
- `/api/portfolio/update` - Saves markdown
- `/api/portfolio/current` - Retrieves markdown
- `/api/resume/generate` - Uses for resumes
- `/api/cover-letter/generate` - Uses for cover letters
- `/api/chat` - Career coach uses for context
- `/api/assistant/global` - Global AI uses for personalization

---

## 🧪 Verification Commands

### Check if profile has content
```javascript
fetch('/api/portfolio/current', {credentials: 'include'})
  .then(r => r.json())
  .then(d => console.log('Markdown:', d.portfolio.markdown?.slice(0, 200)));
```

### Verify authentication
```javascript
fetch('/api/portfolio/current', {credentials: 'include'})
  .then(r => r.json())
  .then(d => console.log('Auth:', d.success ? 'OK' : 'FAIL'));
```

---

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| Save doesn't work | Check console (F12), verify logged in |
| Content disappears | Database issue, check Supabase |
| AI outputs generic | Profile needs more detail |
| File upload fails | Check file size (<10MB), check console |
| URL scraping empty | Some sites block scraping, try different URL |
| Rate limit error | Add your own API key in Settings |

---

## 📊 Success Checklist

After setup, you should be able to:

- [ ] Save markdown and have it persist
- [ ] Upload files and extract content
- [ ] Scrape URLs successfully
- [ ] Generate personalized resumes
- [ ] Generate personalized cover letters
- [ ] Get personalized career advice
- [ ] Use global AI with context

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| **PROFILE_FIX_SUMMARY.md** | What was fixed, what to do now |
| **PROFILE_SYSTEM_COMPLETE.md** | Complete architecture & technical details |
| **PROFILE_TESTING_GUIDE.md** | Step-by-step testing instructions |
| **PROFILE_QUICK_REFERENCE.md** | This file - quick lookup |

---

## 🎯 Priority Actions

### Right Now (5 min)
1. Test that saving works
2. Add basic content to your profile
3. Click Save (Ctrl+S)

### Today (30 min)
1. Build comprehensive profile
2. Add all work experience
3. List all skills
4. Document key projects

### This Week
1. Test resume generation
2. Test cover letter generation
3. Use career coach chat
4. Keep profile updated

---

## 🔑 Key Takeaways

1. **Markdown is the single source of truth** for all AI features
2. **More detail in profile = better AI outputs**
3. **Three ways to add content**: typing, AI assistant, URL scraping
4. **Always click Save** after making changes
5. **Keep it updated** for best results

---

## 🆘 Emergency Fix

If markdown column is missing:

```sql
-- Run in Supabase SQL Editor
ALTER TABLE user_portfolios
ADD COLUMN IF NOT EXISTS markdown TEXT;
```

If profile not saving:

1. Check browser console (F12)
2. Check Network tab → POST /api/portfolio/update
3. Look for error message
4. Verify logged in
5. Check Supabase logs

---

## 🚀 The System is Ready!

✅ Database migration applied
✅ All API routes verified
✅ Global AI updated
✅ Documentation complete

**Now go build your profile and start generating amazing personalized content!** 🎉
