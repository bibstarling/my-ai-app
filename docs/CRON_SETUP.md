# Automated Job Ingestion - Cron Setup

The Job Intelligence Platform includes automated daily job ingestion via cron jobs. This runs at midnight every day to keep your job listings fresh.

## How It Works

**Endpoint**: `/api/cron/daily-job-ingestion`
**Schedule**: Every day at midnight (00:00 UTC)
**Duration**: 3-5 minutes
**Actions**:
1. Fetches jobs from all sources (RemoteOK, Remotive, Adzuna, GetOnBoard)
2. Normalizes and deduplicates
3. Updates sync metrics
4. Stores new/updated jobs

## Deployment Options

### Option 1: Vercel Cron (Recommended) ✅

Already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-job-ingestion",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Setup**:
1. Deploy to Vercel: `vercel --prod`
2. Cron runs automatically at midnight UTC
3. Monitor in Vercel Dashboard → Cron Jobs

**Requirements**:
- Vercel Pro or Enterprise plan for cron jobs
- Or use Vercel's free tier with GitHub Actions (see Option 2)

**Security** (Optional):
Add `CRON_SECRET` to Vercel environment variables for authenticated requests.

---

### Option 2: GitHub Actions (Free Alternative)

Create `.github/workflows/daily-job-ingestion.yml`:

```yaml
name: Daily Job Ingestion

on:
  schedule:
    # Run at midnight UTC every day
    - cron: '0 0 * * *'
  
  # Allow manual trigger
  workflow_dispatch:

jobs:
  ingest-jobs:
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Job Pipeline
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/daily-job-ingestion" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -f || exit 1
      
      - name: Check Status
        if: failure()
        run: echo "Job ingestion failed! Check application logs."
```

**Setup**:
1. Add secrets in GitHub repo settings:
   - `APP_URL`: Your production URL (e.g., https://myapp.vercel.app)
   - `CRON_SECRET`: Random secret string
2. Commit the workflow file
3. Runs automatically at midnight UTC

---

### Option 3: Manual Cron (Self-Hosted)

If self-hosting, use system cron:

```bash
# Edit crontab
crontab -e

# Add this line (runs at midnight)
0 0 * * * curl -X GET https://your-app.com/api/cron/daily-job-ingestion \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  >> /var/log/job-ingestion.log 2>&1
```

---

### Option 4: Cloud Scheduler (GCP/AWS)

**Google Cloud Scheduler**:
```bash
gcloud scheduler jobs create http daily-job-ingestion \
  --schedule="0 0 * * *" \
  --uri="https://your-app.com/api/cron/daily-job-ingestion" \
  --http-method=GET \
  --headers="Authorization=Bearer YOUR_CRON_SECRET" \
  --time-zone="UTC"
```

**AWS EventBridge**:
Create a scheduled rule that triggers a Lambda function to call your endpoint.

---

## Security

### Protect Your Cron Endpoint

1. **Generate a secret**:
   ```bash
   openssl rand -base64 32
   ```

2. **Add to environment variables**:
   ```bash
   # .env.local (local dev)
   CRON_SECRET=your_generated_secret
   
   # Vercel Dashboard → Settings → Environment Variables
   CRON_SECRET=your_generated_secret
   ```

3. **The endpoint validates the secret** (see `/api/cron/daily-job-ingestion/route.ts`)

Without a secret, anyone could trigger your pipeline. With a secret, only authorized callers can run it.

---

## Testing

### Local Testing

```bash
# Without secret
curl http://localhost:3000/api/cron/daily-job-ingestion

# With secret
curl http://localhost:3000/api/cron/daily-job-ingestion \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Production Testing

```bash
curl https://your-app.vercel.app/api/cron/daily-job-ingestion \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Monitoring

### View Cron Logs

**Vercel**:
1. Dashboard → Your Project → Cron Jobs
2. Click on `daily-job-ingestion`
3. View execution history and logs

**GitHub Actions**:
1. Repository → Actions tab
2. Click "Daily Job Ingestion"
3. View run history

### Check Sync Metrics

Admin dashboard shows last sync time and status:
```
http://localhost:3000/admin/jobs
```

Or query directly:
```sql
SELECT * FROM job_sync_metrics ORDER BY last_sync_at DESC;
```

---

## Troubleshooting

### Cron not running?

**Vercel**:
- Check you're on Pro/Enterprise plan
- Verify cron is enabled in dashboard
- Check deployment logs

**GitHub Actions**:
- Verify secrets are set correctly
- Check Actions tab for errors
- Ensure APP_URL is correct

### Cron running but no jobs?

1. Check application logs in Vercel
2. Verify API keys in environment variables
3. Check admin dashboard for error messages
4. Manually trigger pipeline to test: `/admin/jobs`

### Rate limits?

Some APIs have rate limits:
- **RemoteOK**: No known limits
- **Remotive**: No known limits
- **Adzuna**: 250 calls/month free tier
- **GetOnBoard**: Check your plan

**Solution**: Spread requests across the day or upgrade API plans.

---

## Customization

### Change Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-job-ingestion",
      "schedule": "0 2 * * *"  // 2 AM UTC instead of midnight
    }
  ]
}
```

**Cron Syntax**:
```
 ┌────────────── minute (0-59)
 │ ┌──────────── hour (0-23)
 │ │ ┌────────── day of month (1-31)
 │ │ │ ┌──────── month (1-12)
 │ │ │ │ ┌────── day of week (0-6) (Sunday=0)
 │ │ │ │ │
 * * * * *
```

**Examples**:
- `0 0 * * *` - Every day at midnight
- `0 2 * * *` - Every day at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of each month

### Run Multiple Times Per Day

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-job-ingestion",
      "schedule": "0 */12 * * *"  // Every 12 hours
    }
  ]
}
```

### Different Sources at Different Times

Create separate endpoints:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest-remoteok",
      "schedule": "0 0 * * *"  // RemoteOK at midnight
    },
    {
      "path": "/api/cron/ingest-adzuna",
      "schedule": "0 6 * * *"  // Adzuna at 6 AM
    }
  ]
}
```

---

## Status

✅ **Cron Configuration**: Complete and ready
✅ **Endpoint Created**: `/api/cron/daily-job-ingestion`
✅ **Vercel Config**: Updated in `vercel.json`
✅ **Security**: Optional CRON_SECRET support
✅ **Monitoring**: Admin dashboard integration

**Next Step**: Deploy to Vercel to activate the cron job!

```bash
vercel --prod
```

After deployment, your jobs will automatically refresh every night at midnight! 🌙
