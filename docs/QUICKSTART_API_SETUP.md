# Quick Start: API Setup

Get your app running with AI in 5 minutes!

## Option 1: Use System API (Quick Start)

Just add your Anthropic API key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Pros:** Fast setup, works immediately
**Cons:** 1M tokens/month limit shared across all users

## Option 2: Let Users Bring Their Own API (Recommended)

Users configure their own API keys in the app.

### Setup Steps:

1. **Run the database migration:**
```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20260210_add_api_keys_and_usage.sql
```

2. **Users add their API keys:**
- Navigate to Settings > API Configuration
- Choose provider (Groq, OpenAI, or Anthropic)
- Add API key
- Test connection
- Save

3. **That's it!** The app will:
- Use the user's API if configured
- Fall back to system API if not configured
- Track usage and costs automatically

## Recommended: Groq (FREE!)

Tell your users to start with Groq:
1. Sign up at [console.groq.com](https://console.groq.com)
2. Get a free API key
3. Add it to Settings > API Configuration
4. Enjoy **7,000 free requests/day**!

## Next Steps

- Read [API_CONFIGURATION.md](./API_CONFIGURATION.md) for full details
- Check usage tracking at Settings > Account
- Configure billing alerts with your provider
