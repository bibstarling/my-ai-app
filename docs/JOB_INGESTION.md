# Job Ingestion & Matching

Multi-source remote job ingestion (RemoteOK, Remotive, Adzuna), canonical schema, deduplication, skills enrichment, and ranked matches for users.

## Environment variables

Set these in your host (e.g. Vercel, `.env.local`):

| Variable | Description |
|----------|-------------|
| `REMOTEOK_ENABLED` | Set to `false` to disable RemoteOK. Default: enabled. |
| `REMOTIVE_ENABLED` | Set to `false` to disable Remotive. Default: enabled. |
| `ADZUNA_ENABLED` | Set to `false` to disable Adzuna. Default: enabled. |
| `ADZUNA_APP_ID` | Adzuna API app ID (from [developer.adzuna.com](https://developer.adzuna.com)). |
| `ADZUNA_APP_KEY` | Adzuna API app key. |
| `ADZUNA_COUNTRIES` | Comma-separated country codes for Adzuna (e.g. `us,gb`). Default: `us,gb`. |
| `JOB_EXPIRE_DAYS` | Mark jobs as expired if not seen in N days. Default: `14`. |
| `DEFAULT_REMOTE_REGION` | Default region when none parsed. Default: `global`. |
| `OPTIONAL_LLM_SKILLS_ENABLED` | Set to `true` to enable LLM-based skills extraction. Default: `false`. |
| `OPTIONAL_LLM_PROVIDER` | `openai` (OpenAI/OpenRouter/Azure) or `anthropic`. Default: `openai`. |
| `OPTIONAL_LLM_API_KEY` | API key for the chosen provider. Required when LLM skills enabled. |
| `OPTIONAL_LLM_MODEL` | Model name (e.g. `gpt-4o-mini`, `claude-3-5-haiku-20241022`). Optional; defaults per provider. |
| `OPTIONAL_LLM_BASE_URL` | Override API base URL (e.g. for OpenRouter or Azure). Optional. |
| `CRON_SECRET` or `JOB_SYNC_CRON` | Secret for authorizing sync (POST /api/admin/jobs/sync). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only; for ingestion and admin). |

## Database

Run the migration in Supabase (SQL Editor or CLI):

```bash
# If using Supabase CLI
supabase db push
```

Or paste the contents of `supabase/migrations/20260204000000_job_ingestion_schema.sql` into the SQL Editor.

## How to run sync

### Manual (API)

Trigger a full sync for all enabled sources:

```bash
curl -X POST "https://your-app.vercel.app/api/admin/jobs/sync" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  # or: -H "x-cron-secret: YOUR_CRON_SECRET"
```

Use the same value as `CRON_SECRET` or `JOB_SYNC_CRON` in the header.

### Scheduled (e.g. Vercel Cron)

In `vercel.json` you can add a cron job that calls the sync endpoint every 30–60 minutes (see [Vercel Cron](https://vercel.com/docs/cron-jobs)). The sync route checks `CRON_SECRET` or `JOB_SYNC_CRON` and only runs when the request includes that secret.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/jobs/sync` | Run ingestion for all sources (requires cron secret). |
| GET | `/api/health` | Health and stats: `last_sync_time`, `job_count`, `by_source`. |
| GET | `/api/jobs/ingestion` | List canonical jobs. Query: `query`, `remote_type`, `region_eligibility`, `seniority`, `posted_since`, `source`, `limit`, `offset`. |
| GET | `/api/jobs/ingestion/:id` | Get one job by id. |
| GET | `/api/matches` | Ranked matches for the current user (requires auth). Query: `limit`. |

## User profile for matching

Matching uses `user_job_profiles` (keyed by `clerk_id`): `skills_json`, `role_keywords`, `preferred_regions`, `exclude_companies`. Ensure the app creates/updates this row when the user sets preferences; then `GET /api/matches` returns jobs ranked by skill overlap, title relevance, recency, and region/quality penalties.

## Tests

```bash
npm run test
```

Tests cover: normalization and dedupe key generation, exact matching, skills extraction (dictionary baseline), and ranking logic.
