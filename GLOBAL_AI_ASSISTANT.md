# Global AI Assistant

## 🎉 What's New

You now have a **global AI assistant** that's accessible from anywhere in the app!

## ✨ Features

### 1. **Universal Access**
- Press **`Cmd+K`** (Mac) or **`Ctrl+K`** (Windows/Linux) from anywhere
- Or click the floating **"Ask AI"** button in the bottom-right corner

### 2. **Smart Actions**
The AI can perform platform actions directly:
- 🔍 **Search jobs**: "Find remote React jobs"
- 📄 **Create resumes**: "Generate a resume for this job"
- ✉️ **Write cover letters**: "Write a cover letter for Google"
- 💼 **Track applications**: "Add this job to my pipeline"
- 📝 **Update profile**: "Add my latest project"
- 🤖 **Career advice**: "How should I prepare for interviews?"

### 3. **Context-Aware**
- Knows what page you're on
- Remembers recent conversation context
- Provides relevant suggestions based on your location

### 4. **Quick Actions**
Pre-filled prompts for common tasks:
- Find jobs
- Create resume
- Write cover letter
- Track job

## 🚀 How It Works

### User Experience
1. User presses `Cmd+K` or clicks "Ask AI"
2. Modal opens with AI assistant
3. User types: "Find remote Python jobs"
4. AI responds and navigates to job search with query
5. Or: "Generate a resume" → Opens resume builder

### Available Actions

The AI can trigger these actions:

```typescript
// Navigate to pages
{ type: "navigate", path: "/assistant/job-search", label: "Job Search" }

// Search for jobs
{ type: "search_jobs", query: "remote React developer" }

// Generate resume
{ type: "generate_resume" }

// Track jobs (future)
{ type: "create_job", jobData: {...} }
```

## 📁 Files Created

1. **`app/components/GlobalAIAssistant.tsx`**
   - Main assistant component
   - Handles UI, messaging, actions

2. **`app/api/assistant/global/route.ts`**
   - AI endpoint that processes requests
   - Determines intent and triggers actions

3. **Updated `app/components/AppLayout.tsx`**
   - Integrated assistant globally
   - Added Cmd+K keyboard shortcut
   - Added floating button

## 🎨 UI/UX

### Modal Design
- **Large, centered** modal (max-width 3xl)
- **Quick action buttons** at the top
- **Scrollable** message history
- **Input** with send button at bottom

### Floating Button
- **Bottom-right corner**
- **Gradient background** (brand colors)
- Shows **"Ask AI"** text
- Displays **"⌘K"** shortcut on hover
- **Smooth animations**

### Colors
- User messages: Accent color (orange)
- AI messages: Gray background
- System messages: Blue background
- Loading: Animated spinner

## 🔮 Future Enhancements

### Planned Actions
1. **Create Job Posting** - Directly from chat
2. **Generate Cover Letter** - With job context
3. **Schedule Reminders** - For follow-ups
4. **Export Documents** - Download resume/cover letter
5. **Update Application Status** - Move jobs in pipeline

### Additional Features
1. **Voice Input** - Speak your commands
2. **File Uploads** - Attach documents in chat
3. **Suggested Actions** - Based on context
4. **Multi-step Workflows** - "Apply to this job" (finds job, generates resume, writes cover letter)

## 🧪 Testing

### Test Scenarios

1. **Job Search**
   ```
   User: "Find remote React jobs"
   Expected: AI responds, then navigates to /assistant/job-search?q=remote+React+jobs
   ```

2. **Resume Generation**
   ```
   User: "Create a resume"
   Expected: AI responds, then navigates to /resume-builder
   ```

3. **Career Advice**
   ```
   User: "How do I prepare for technical interviews?"
   Expected: AI provides helpful advice (no navigation)
   ```

4. **Context Awareness**
   ```
   User on /dashboard: "Show me my applications"
   Expected: AI mentions dashboard features or navigates to relevant section
   ```

### Keyboard Shortcut Test
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
2. Modal should open
3. Press `Escape` to close
4. Press `Cmd+K` again to reopen

## 📊 API Usage

Uses the centralized AI provider (`lib/ai-provider.ts`):
- Respects user's API keys if configured
- Falls back to system API with usage limits
- Tracks usage per feature (`global_assistant`)

## 🎯 User Intent Detection

The AI detects user intent from natural language:

| User Says | Intent | Action |
|-----------|--------|--------|
| "Find jobs", "Search for", "Looking for" | Job Search | `search_jobs` |
| "Create resume", "Generate resume" | Resume Builder | `navigate` |
| "Write cover letter", "Cover letter for" | Cover Letters | `navigate` |
| "Add job", "Track this job" | Add to Pipeline | `create_job` |
| "Go to", "Open", "Show me" | Navigation | `navigate` |
| Questions, "How", "What", "Why" | Career Advice | No action, just respond |

## 🔒 Security

- ✅ Requires authentication (checks `userId`)
- ✅ Uses user's own API keys when available
- ✅ Server-side AI calls (keys never exposed to client)
- ✅ Input validation and sanitization

## 📝 Next Steps

1. **Test locally** with `npm run dev`
2. **Try the assistant** by pressing `Cmd+K`
3. **Test different commands**:
   - "Find remote jobs"
   - "Create a resume"
   - "Help me with interview prep"
4. **Deploy to production** (see deployment notes below)

## 🚀 Deployment

### Current Issue
The Vercel CLI is having trouble with the Clerk environment variable format. 

### Solution
**Deploy via Vercel Dashboard** instead:
1. Commit changes: `git add . && git commit -m "Add global AI assistant"`
2. Push to GitHub: `git push`
3. Vercel will auto-deploy from GitHub
4. Or manually deploy via Vercel Dashboard

### Environment Variables
Make sure these are set correctly in Vercel:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Your Clerk publishable key
- `CLERK_SECRET_KEY` = Your Clerk secret key

## 💡 Tips

- The assistant works best with natural language
- You can be conversational: "Hey, can you help me find a job?"
- Quick actions at the top for common tasks
- Use arrow keys to navigate suggestions (future enhancement)
- Press Escape to close anytime

Enjoy your new AI-powered career assistant! 🎉
