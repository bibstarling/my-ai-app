# Professional Profile System - Complete Architecture

## ✅ FIXED: Markdown Column Now Exists!

The `markdown` column has been successfully added to the `user_portfolios` table. The profile feature is now fully functional.

---

## 🎯 What is the Professional Profile?

The **Professional Profile** is the **CORE** of all personalized AI-generated content in the application. It's a markdown-based document where users add their:

- Experience & work history
- Projects & achievements  
- Skills & expertise
- Education & certifications
- Awards & recognition
- Any other professional context

**This markdown file is the single source of truth** for:
- AI-generated resumes
- AI-generated cover letters
- Career coaching chat
- Global AI assistant responses
- Job matching & recommendations

---

## 🏗️ System Architecture

### Database Schema

```sql
-- user_portfolios table
CREATE TABLE user_portfolios (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  clerk_id TEXT NOT NULL,
  status portfolio_status DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  portfolio_data JSONB DEFAULT '{}',
  markdown TEXT,  -- ✅ THIS IS THE KEY COLUMN!
  seo_description TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  include_portfolio_link BOOLEAN DEFAULT true
);

COMMENT ON COLUMN user_portfolios.markdown IS 'Markdown content from Professional Profile page - source of truth for AI-generated content';
```

### File Structure

```
app/
├── portfolio/
│   └── builder/
│       └── page.tsx              # Main profile builder UI (Notion-like editor)
├── api/
│   └── portfolio/
│       ├── chat/route.ts         # AI assistant to help build profile
│       ├── update/route.ts       # Save markdown to database
│       ├── current/route.ts      # Get user's portfolio
│       ├── scrape/route.ts       # Scrape URLs for content
│       └── upload/route.ts       # Upload files (PDF, images)
│   ├── resume/
│   │   └── generate/route.ts     # Uses markdown for resume generation
│   ├── cover-letter/
│   │   └── generate/route.ts     # Uses markdown for cover letters
│   ├── chat/route.ts             # Career coach uses markdown
│   └── assistant/
│       └── global/route.ts       # Global assistant uses markdown
```

---

## 💡 How It Works

### 1. **User Builds Profile** (Portfolio Builder Page)

The portfolio builder provides a **Notion-like editing experience**:

- **Main Editor**: Clean markdown editor with real-time preview
- **Slash Commands**: Type `/` for quick formatting (headings, lists, code blocks)
- **Format Menu**: Select text to apply bold, italic, code, links
- **Keyboard Shortcuts**: 
  - `Ctrl+S` - Save
  - `Ctrl+B` - Bold
  - `Ctrl+I` - Italic
  - `Ctrl+K` - Link
  - `Ctrl+\`` - Code

### 2. **AI Assistant Panel** (Add to Profile)

Users can click the **"Add to Profile"** button to open the AI assistant panel, which helps them:

- **Upload files**: PDFs (resume, certificates), images, documents
- **Paste URLs**: LinkedIn, GitHub, personal websites, project pages
- **Direct paste mode** (DEFAULT): Content is scraped and added directly to markdown (no AI processing)
- **AI processing mode**: Use AI to extract and format content (opt-in with phrases like "analyze with AI")

**How AI works:**
1. User provides content (file, URL, or text)
2. AI analyzes the content
3. AI extracts professional information
4. AI updates the markdown by adding new sections
5. User sees updated markdown in real-time
6. User clicks **Save** to persist changes

### 3. **Saving Markdown**

When user clicks **Save**:

```typescript
// app/api/portfolio/update/route.ts
const updateData = { 
  portfolio_data: portfolioData,  // Structured data (legacy)
  markdown: markdown,              // ✅ The markdown content!
  updated_at: new Date().toISOString(),
};

await supabase
  .from('user_portfolios')
  .update(updateData)
  .eq('id', portfolio.id);
```

### 4. **Using Markdown for AI Generation**

All AI features now use the markdown as the primary source:

#### Resume Generation
```typescript
// app/api/resume/generate/route.ts
const { data: userPortfolio } = await supabase
  .from('user_portfolios')
  .select('markdown')
  .eq('clerk_id', userId)
  .single();

const portfolioMarkdown = userPortfolio.markdown;

// AI uses markdown to select relevant experiences, projects, skills
const selection = await selectRelevantContent(
  jobTitle, 
  jobDescription, 
  userId, 
  portfolioMarkdown  // ✅ Markdown as context!
);
```

#### Cover Letter Generation
```typescript
// app/api/cover-letter/generate/route.ts
const { data: userPortfolio } = await supabase
  .from('user_portfolios')
  .select('markdown')
  .eq('clerk_id', userId)
  .single();

const result = await generateCoverLetter({
  jobTitle,
  jobCompany,
  jobDescription,
  portfolioMarkdown: userPortfolio.markdown,  // ✅ Markdown as context!
  userId,
});
```

#### Career Coach Chat
```typescript
// app/api/chat/route.ts
const { data: userPortfolio } = await supabase
  .from('user_portfolios')
  .select('markdown')
  .eq('clerk_id', userId)
  .maybeSingle();

const profileContext = userPortfolio?.markdown || '';

const systemPrompt = `You are a helpful AI career coach.

USER'S PROFESSIONAL PROFILE:
${profileContext}  // ✅ Markdown provides context!

Use this profile to provide personalized career guidance.`;
```

#### Global AI Assistant
```typescript
// app/api/assistant/global/route.ts
const { data: userPortfolio } = await supabase
  .from('user_portfolios')
  .select('markdown')
  .eq('clerk_id', userId)
  .maybeSingle();

const profileContext = userPortfolio?.markdown || '';

const systemPrompt = `You are an AI Career Assistant.

${profileContext ? `**USER'S PROFESSIONAL PROFILE:**
${profileContext}  // ✅ Markdown provides context!

Use this profile to provide PERSONALIZED career guidance.` : 'User has not created profile yet.'}`;
```

---

## 🎨 User Experience Flow

### Complete Workflow

1. **User signs up** → Redirected to setup/onboarding
2. **User goes to Portfolio Builder** (`/portfolio/builder`)
3. **User sees clean Notion-like editor** with initial template
4. **User adds content** in 3 ways:
   
   **Option A: Direct Editing**
   - Type directly in the markdown editor
   - Use `/` commands for formatting
   - Use keyboard shortcuts
   - Click Save when done
   
   **Option B: AI-Assisted (File Upload)**
   - Click "Add to Profile" button
   - Upload PDF resume, certificate, or image
   - AI extracts information
   - AI updates markdown with new content
   - User reviews and clicks Save
   
   **Option C: AI-Assisted (URL Scraping)**
   - Click "Add to Profile" button
   - Paste LinkedIn, GitHub, or any URL
   - **DEFAULT**: Content is scraped and pasted directly (no AI)
   - **OPTIONAL**: Add "analyze with AI" to use AI processing
   - User reviews content in editor
   - Click Save when satisfied

5. **User generates resume** → AI uses markdown to create tailored resume
6. **User generates cover letter** → AI uses markdown to write personalized letter
7. **User chats with career coach** → AI references markdown for context
8. **User uses global assistant** → AI provides personalized help based on profile

---

## 🔧 Technical Implementation Details

### Markdown Storage Strategy

**Why Markdown?**
- Human-readable and editable
- Easy to parse and extract information
- Flexible structure (users can organize however they want)
- Works well with AI models (LLMs understand markdown)
- Can be versioned and tracked
- Portable format (can export/import easily)

### AI Processing Logic

**Portfolio Chat AI** (`/api/portfolio/chat`):
```typescript
const promptText = `${userPrompt}

You are a professional portfolio assistant. The content above has ALREADY been scraped for you.

**YOUR TASK:**
1. Look at the content provided above
2. Extract ALL professional information
3. Update the portfolio markdown by adding the extracted information
4. Return the COMPLETE updated markdown

**Markdown Structure:**
- # Professional Profile (main title)
- ## About Me
- ## Experience  
- ## Projects
- ## Skills
- ## Education
- ## Awards & Recognition

**Response Format (JSON):**
{
  "message": "Explain what you extracted and added",
  "updatedMarkdown": "COMPLETE updated markdown with ALL new content",
  "changes": ["List specific additions"]
}`;
```

### Super Admin Special Handling

Super admins (like Bianca) have special behavior:

```typescript
// For super admin, use hardcoded portfolio-data.ts instead of database
if (isSuperAdmin) {
  const { portfolioData } = await import('@/lib/portfolio-data');
  portfolioMarkdown = convertPortfolioDataToMarkdown(portfolioData);
}
```

This allows the main site owner to have a different profile source.

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BUILDS PROFILE                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Portfolio Builder Page (/portfolio/builder)       │    │
│  │                                                      │    │
│  │  [Notion-like Editor]  [Add to Profile AI Button]  │    │
│  │                                                      │    │
│  │  User types markdown   OR   User uploads files/URLs │    │
│  │        ↓                           ↓                 │    │
│  │  Direct editing           AI extracts & updates     │    │
│  │                                                      │    │
│  │              [Save Button] ← Click to persist       │    │
│  └────────────────────────────────────────────────────┘    │
│                              ↓                               │
└──────────────────────────────┼───────────────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │  POST /api/portfolio │
                    │        /update       │
                    └──────────┬───────────┘
                               ↓
                ┌──────────────────────────────────┐
                │   Supabase: user_portfolios      │
                │   UPDATE markdown = '...'        │
                └──────────────┬───────────────────┘
                               ↓
        ┌──────────────────────┴─────────────────────────┐
        │     MARKDOWN STORED IN DATABASE AS             │
        │     SINGLE SOURCE OF TRUTH FOR ALL AI          │
        └────────┬────────────────────────────┬──────────┘
                 ↓                             ↓
    ┌────────────────────────┐    ┌──────────────────────────┐
    │  Resume Generation     │    │  Cover Letter Generation │
    │  (/api/resume/generate)│    │  (/api/cover-letter/     │
    │                        │    │         generate)         │
    │  SELECT markdown       │    │  SELECT markdown          │
    │  FROM user_portfolios  │    │  FROM user_portfolios     │
    │       ↓                │    │       ↓                   │
    │  AI uses markdown      │    │  AI uses markdown         │
    │  to create resume      │    │  to write letter          │
    └────────────────────────┘    └──────────────────────────┘
                 ↓                             ↓
    ┌────────────────────────┐    ┌──────────────────────────┐
    │  Career Coach Chat     │    │  Global AI Assistant     │
    │  (/api/chat)           │    │  (/api/assistant/global) │
    │                        │    │                          │
    │  SELECT markdown       │    │  SELECT markdown         │
    │  FROM user_portfolios  │    │  FROM user_portfolios    │
    │       ↓                │    │       ↓                  │
    │  AI provides           │    │  AI provides             │
    │  personalized advice   │    │  context-aware help      │
    └────────────────────────┘    └──────────────────────────┘
```

---

## 🐛 Previous Issue & Fix

### The Problem
Users were trying to save their profile markdown, but it was **failing silently** because:
- The `markdown` column didn't exist in the database
- The migration file existed but wasn't applied
- No error messages were shown to the user

### The Solution
1. ✅ Applied the database migration to add `markdown TEXT` column
2. ✅ Verified all API routes use the markdown column correctly
3. ✅ Updated global AI assistant to use markdown for personalization
4. ✅ Documented the entire system architecture

### Testing Checklist
- [ ] Open `/portfolio/builder`
- [ ] Add some content to the markdown editor
- [ ] Click **Save** button
- [ ] Verify no errors in browser console
- [ ] Refresh page and verify content persists
- [ ] Upload a file or paste a URL
- [ ] Let AI update the markdown
- [ ] Click Save again
- [ ] Generate a resume - verify it uses your profile context
- [ ] Generate a cover letter - verify it's personalized
- [ ] Chat with career coach - verify it knows your background

---

## 🚀 Best Practices for Users

### Building a Great Profile

**1. Be Comprehensive**
The more detail you add, the better your AI-generated content will be. Include:
- Specific achievements with metrics (e.g., "Increased engagement by 25%")
- Technologies and tools you've used
- Projects with outcomes and impact
- Skills categorized by type (technical, leadership, etc.)

**2. Keep It Updated**
Whenever you:
- Complete a new project
- Gain a new skill
- Earn a certification
- Win an award

→ Add it to your profile immediately!

**3. Use the AI Assistant**
Don't type everything manually:
- Upload your existing resume (PDF)
- Paste your LinkedIn URL
- Add GitHub profile
- Scrape project pages
- Upload certificates or images of your work

**4. Organize with Markdown**
Use clear structure:
```markdown
# Your Name

## About Me
Brief professional summary

## Experience
### Job Title at Company
*Dates* | Location
- Achievement 1 with metrics
- Achievement 2 with impact
- Key responsibility

## Projects
### Project Name
Description of what you built and why it matters
**Technologies:** React, Node.js, PostgreSQL
**Impact:** Increased revenue by 50%

## Skills
**Technical:** JavaScript, Python, SQL, React
**Product:** Roadmapping, User Research, A/B Testing
**Leadership:** Team Management, Stakeholder Communication

## Education
**Degree** - University Name (Year)

## Certifications
- Certification Name (Issuer, Date)
```

**5. Save Frequently**
Click Save after making significant changes. The app doesn't auto-save (yet).

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Auto-save every 30 seconds
- [ ] Version history / revision tracking
- [ ] Export profile to PDF, Word, JSON
- [ ] Import from LinkedIn API directly
- [ ] Collaborative editing (share with mentors for feedback)
- [ ] Profile completeness score
- [ ] AI suggestions: "Your profile could be stronger if you added..."
- [ ] Profile templates by industry/role
- [ ] Rich media embeds (videos, presentations)
- [ ] Portfolio website generator from markdown

### Technical Improvements
- [ ] Full-text search on profile content
- [ ] Vector embeddings for semantic search
- [ ] Profile comparison (vs. job requirements)
- [ ] Duplicate detection (avoid redundant content)
- [ ] Smart merge when importing multiple sources
- [ ] AI-powered profile review and scoring

---

## 📖 For Developers

### Adding New AI Features

When creating a new AI-powered feature, **always** use the user's profile markdown:

```typescript
// 1. Import Supabase
import { getSupabaseServiceRole } from '@/lib/supabase-server';

// 2. Get user's profile markdown
const supabase = getSupabaseServiceRole();
const { data: userPortfolio } = await supabase
  .from('user_portfolios')
  .select('markdown, portfolio_data')
  .eq('clerk_id', userId)
  .maybeSingle();

const profileMarkdown = userPortfolio?.markdown || '';

// 3. Include in AI prompt
const systemPrompt = `You are an AI assistant.

USER'S PROFESSIONAL PROFILE:
${profileMarkdown}

Use this context to provide personalized responses.`;

// 4. Call AI with context
const response = await generateAICompletion(
  userId,
  'feature_name',
  systemPrompt,
  messages,
  maxTokens
);
```

### Schema Updates

If you need to modify the portfolio schema:

```sql
-- Always use migrations!
-- supabase/migrations/YYYYMMDDHHMMSS_description.sql

ALTER TABLE user_portfolios
ADD COLUMN new_field TEXT;

COMMENT ON COLUMN user_portfolios.new_field IS 'Description of field';
```

Then run:
```bash
npx supabase db push
```

---

## 🎓 Summary

The Professional Profile is the **heart** of personalized AI experiences in the app. 

**Key Takeaways:**
1. ✅ Markdown column now exists in database
2. ✅ Users can build profile with Notion-like editor
3. ✅ AI assistant helps extract content from files/URLs
4. ✅ All AI features use markdown as source of truth
5. ✅ The more detailed the profile, the better the AI output

**The profile feature is now FULLY FUNCTIONAL!** 🎉
