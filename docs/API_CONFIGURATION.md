# API Configuration & Usage Tracking

This document explains how to configure your own AI API keys and track usage costs in the app.

## Overview

Instead of using the shared system API (which has limits), users can connect their own LLM API keys to:
- **Avoid usage limits** - Use as much as you need
- **Control costs** - Pay directly to the provider at their rates
- **Choose providers** - Pick the AI provider that works best for you
- **Track spending** - See detailed usage statistics and estimated costs

## Supported Providers

### 1. Groq (Recommended - FREE Tier!)

**Why Groq?**
- 🆓 **FREE tier**: 7,000 requests/day, 60 requests/min
- ⚡ **Super fast**: Fastest inference speeds available
- 💰 **Cheap paid tier**: $0.59/M tokens after free tier

**Models:**
- `llama-3.3-70b-versatile` - Latest Llama model (recommended)
- `llama-3.1-70b-versatile` - Previous Llama version
- `mixtral-8x7b-32768` - Mixtral alternative

**Get API Key:**
1. Sign up at [console.groq.com](https://console.groq.com)
2. Go to API Keys section
3. Create a new API key
4. Add it to the app at Settings > API Configuration

### 2. OpenAI

**Models:**
- `gpt-4o` - Latest GPT-4 ($2.50/M input, $10/M output)
- `gpt-4o-mini` - Cheaper GPT-4 ($0.15/M input, $0.60/M output) - recommended
- `gpt-3.5-turbo` - Fastest & cheapest ($0.50/M input, $1.50/M output)

**Get API Key:**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Add payment method
3. Generate API key at [API Keys page](https://platform.openai.com/api-keys)

### 3. Anthropic Claude

**Models:**
- `claude-sonnet-4-20250514` - Latest Claude ($3/M input, $15/M output)
- `claude-3-5-sonnet-20241022` - Previous Sonnet
- `claude-3-haiku-20240307` - Fastest & cheapest ($0.25/M input, $1.25/M output)

**Get API Key:**
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Add payment method
3. Generate API key in Settings

## Setup Instructions

### Step 1: Get an API Key

Choose a provider (we recommend starting with **Groq for free**) and follow their signup process to get an API key.

### Step 2: Add API Key to App

1. Go to **Settings > API Configuration** in the app
2. Select your provider (Anthropic, OpenAI, or Groq)
3. Paste your API key
4. Click **Test Connection** to verify it works
5. Click **Save Configuration**

### Step 3: Start Using

That's it! All AI features will now use your configured API:
- Portfolio Chat
- Resume Generation
- Cover Letter Writing
- AI Assistant
- Job Matching

## Usage Tracking

### View Your Usage

Go to **Settings > Account** to see:
- Total requests made
- Total tokens used
- Estimated costs
- Breakdown by provider
- Breakdown by feature (portfolio, resume, etc.)

### Time Ranges

View usage for:
- Last 7 days
- Last 30 days
- Last 90 days

### Cost Estimation

Costs are calculated based on:
- **Input tokens** (prompt/context)
- **Output tokens** (AI response)
- **Current provider pricing** (as of Feb 2026)

> **Note**: Costs are estimates based on provider pricing. Your actual bill may vary slightly.

## System API Fallback

If you don't configure your own API key:
- You'll use the shared system API
- **Limit**: 1M tokens per month
- **Model**: Claude Sonnet 4
- **Cost**: Free (shared across all users)

When you exceed the limit, you'll see an error message asking you to add your own API key.

## Security

- API keys are stored securely in the database
- Keys are never shown in full (only `***************`)
- Keys are **not** shared with other users
- In production, keys should be encrypted (currently not encrypted - add encryption before deploying!)

## Cost Examples

Here's what typical usage might cost with different providers:

### Portfolio Chat (100 messages/month)
- **Groq**: **$0** (within free tier)
- **OpenAI GPT-4o-mini**: ~$0.50
- **Anthropic Claude Haiku**: ~$0.60

### Resume Generation (10 resumes/month)
- **Groq**: **$0** (within free tier)
- **OpenAI GPT-4o-mini**: ~$0.20
- **Anthropic Claude Sonnet**: ~$1.50

### Heavy Usage (500 requests/month)
- **Groq**: **$0-5** (mostly free tier)
- **OpenAI GPT-4o-mini**: ~$5-10
- **Anthropic Claude Sonnet**: ~$20-40

## FAQ

### Can I switch providers?

Yes! Just go to Settings > API Configuration and save a new provider/key. The change takes effect immediately.

### What happens to my old usage data?

All usage data is preserved. You'll see breakdowns by provider in your account settings.

### Can I use multiple providers?

Currently, only one provider can be active at a time. The most recently saved configuration is used.

### How accurate are cost estimates?

Cost estimates are based on current provider pricing (Feb 2026) and token counts. They should be within 5% of actual costs. Always check your provider's dashboard for exact billing.

### Do I need a paid account?

- **Groq**: No! Free tier is generous (7,000 requests/day)
- **OpenAI**: Yes, requires payment method
- **Anthropic**: Yes, requires payment method

### What if my API key stops working?

You'll see error messages when AI features fail. Check:
1. Is your API key still valid?
2. Do you have credits/payment method set up?
3. Did you hit rate limits?

Go to Settings > API Configuration to test your connection or update your key.

## Technical Details

### Database Schema

**user_api_configs table:**
- `clerk_id`: User identifier
- `provider`: 'anthropic' | 'openai' | 'groq' | 'system'
- `api_key`: Encrypted API key
- `is_active`: Whether this config is currently active

**api_usage_logs table:**
- `clerk_id`: User identifier
- `provider`: Which provider was used
- `model`: Which model was used
- `feature`: Which feature (portfolio_chat, resume_generation, etc.)
- `prompt_tokens`: Input token count
- `completion_tokens`: Output token count
- `total_tokens`: Total tokens
- `estimated_cost_usd`: Calculated cost
- `created_at`: Timestamp

### API Endpoints

- `GET /api/settings/api-config` - Get current configuration
- `POST /api/settings/api-config` - Save new configuration
- `DELETE /api/settings/api-config` - Remove configuration
- `POST /api/settings/api-config/test` - Test API connection
- `GET /api/settings/usage?days=30` - Get usage statistics

### Provider Selection Logic

```typescript
// 1. Check if user has configured API
const userConfig = await getUserAPIConfig(userId);

// 2. Use user's API if available
if (userConfig && userConfig.apiKey) {
  provider = userConfig.provider;
  apiKey = userConfig.apiKey;
  model = userConfig.model;
} else {
  // 3. Fall back to system API
  provider = 'system';
  apiKey = process.env.ANTHROPIC_API_KEY;
  model = 'claude-sonnet-4-20250514';
  
  // 4. Check usage limits for system API
  if (totalTokensThisMonth > 1000000) {
    throw new Error('Please add your own API key to continue');
  }
}
```

## Migration Guide

### Running the Migration

1. Run the SQL migration in Supabase:
```bash
supabase migration up
```

Or manually execute:
```sql
-- Run supabase/migrations/20260210_add_api_keys_and_usage.sql
```

2. The migration creates:
- `user_api_configs` table
- `api_usage_logs` table
- `get_user_usage_summary()` function
- RLS policies for security

### No Breaking Changes

The system is **backward compatible**:
- Existing code continues to work
- Users without configured APIs use system API
- No data migration needed
- Opt-in feature for users

## Best Practices

1. **Start with Groq** - It's free and fast
2. **Monitor usage** - Check your account page regularly
3. **Set up billing alerts** - Most providers offer spending alerts
4. **Test connection** - Always test after adding/changing API keys
5. **Keep keys secure** - Never share your API keys

## Roadmap

Future improvements:
- [ ] API key encryption at rest
- [ ] Multiple API keys per provider (rotation)
- [ ] Usage alerts/notifications
- [ ] Budget limits per user
- [ ] More providers (Google Gemini, Mistral)
- [ ] Model selection UI
- [ ] Cost breakdown charts

## Support

If you have questions or issues:
1. Check the FAQ above
2. Test your API connection in Settings
3. Check your provider's status page
4. Contact support with your usage logs
