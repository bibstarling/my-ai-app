# Custom Job Sources Integration Fix

## Problem Summary

Custom job sources (added via the Job Sources UI) were not appearing in the job discovery results, even though they successfully fetched jobs during testing.

## Root Causes

1. **Enum Constraint**: Database columns `jobs.source_primary` and `job_sources.source` used hardcoded enums that only allowed: `remoteok`, `remotive`, `adzuna`, `getonboard`
2. **Custom Scraper Using Wrong Source**: All custom sources stored jobs with `source: 'custom'` instead of their unique `source_key`
3. **Missing Source Display**: Job cards didn't show which job board the listing came from

## Changes Made

### 1. Database Migration
**File**: `migrations/fix_source_fields_for_custom_sources.sql`

- Changed `jobs.source_primary` from enum to `text` to support dynamic sources
- Changed `job_sources.source` from enum to `text`
- Added `jobs.source_name` column for human-readable display names
- Backfilled source_name for existing jobs:
  - remoteok → "RemoteOK"
  - remotive → "Remotive"
  - adzuna → "Adzuna"
  - getonboard → "GetOnBoard"

### 2. Type Definitions
**File**: `lib/types/job-intelligence.ts`

- Changed `JobSourceEnum` from limited enum to `string` type
- Added `source_name?: string` to:
  - `Job` interface
  - `NormalizedJob` interface

### 3. Custom Scraper Worker
**File**: `lib/jobs-ingestion/custom-scraper-worker.ts`

**Before**:
```typescript
constructor(customSource: CustomSourceConfig) {
  super('custom' as JobSourceEnum); // ❌ All custom sources = 'custom'
  this.customSource = customSource;
}

jobs.push({
  source: 'custom' as JobSourceEnum, // ❌ Not unique
  source_id: this.generateSourceId(link),
  title,
  company: this.customSource.name,
  // ... other fields
});
```

**After**:
```typescript
constructor(customSource: CustomSourceConfig) {
  super(customSource.id as JobSourceEnum); // ✅ Use actual source_key
  this.customSource = customSource;
  this.sourceName = customSource.name;
}

jobs.push({
  source: this.source, // ✅ Unique source_key
  source_job_id: this.generateSourceId(link),
  source_url: link,
  raw_data: {
    title,
    description,
    url: link,
    source_name: this.sourceName, // ✅ Human-readable name
    // ... other fields
  },
  fetched_at: new Date().toISOString(),
});
```

### 4. Normalization Service
**File**: `lib/jobs-ingestion/normalization-service.ts`

- Updated `normalize()` to handle custom sources via `default` case
- Added `normalizeCustomSource()` method for generic normalization
- Added `source_name` to all built-in normalizers:
  - RemoteOK → "RemoteOK"
  - Remotive → "Remotive"
  - Adzuna → "Adzuna"
  - GetOnBoard → "GetOnBoard"
- Added `detectRemoteType()` helper for custom sources

### 5. Deduplication Service
**File**: `lib/jobs-ingestion/deduplication-service.ts`

- Added `source_name: job.source_name` when creating canonical jobs

### 6. Job Discovery UI
**File**: `app/(dashboard)/jobs/discover/page.tsx`

- Added `source_name?: string` to `JobResult` interface
- Added source badge to job cards:
  ```tsx
  {job.source_name && (
    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
      via {job.source_name}
    </span>
  )}
  ```

## Testing

### Before Fix
1. Add custom source (e.g., "Himalayas" RSS feed)
2. Test source → ✅ Jobs fetched successfully
3. Run pipeline → ✅ Jobs ingested
4. Search for jobs → ❌ Only RemoteOK and Remotive jobs appear

### After Fix
1. Add custom source (e.g., "Himalayas" RSS feed)
2. Test source → ✅ Jobs fetched successfully
3. Run pipeline → ✅ Jobs ingested with unique source_key
4. Search for jobs → ✅ Jobs from ALL sources appear
5. Job cards show → ✅ "via Himalayas" badge

## Verification Steps

1. **Check database**:
   ```sql
   SELECT 
     source_primary,
     source_name,
     COUNT(*) as job_count
   FROM jobs 
   WHERE status = 'active'
   GROUP BY source_primary, source_name
   ORDER BY job_count DESC;
   ```

2. **Test custom source**:
   - Go to Admin → Job Sources
   - Add a new custom RSS source
   - Click "Test" → Should show jobs fetched
   - Go to Admin → Jobs Pipeline
   - Click "Run Pipeline Now"
   - Go to Jobs → Discover
   - Search → Custom source jobs should appear with badge

## Impact

- ✅ All job sources (built-in + custom) now work in discovery
- ✅ Users can see which job board each listing came from
- ✅ System is extensible for unlimited custom sources
- ✅ No data loss - existing jobs remain intact with backfilled source names

## Related Files

- `migrations/fix_source_fields_for_custom_sources.sql`
- `lib/types/job-intelligence.ts`
- `lib/jobs-ingestion/custom-scraper-worker.ts`
- `lib/jobs-ingestion/normalization-service.ts`
- `lib/jobs-ingestion/deduplication-service.ts`
- `app/(dashboard)/jobs/discover/page.tsx`
