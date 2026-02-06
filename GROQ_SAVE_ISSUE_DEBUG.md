# Groq Configuration Save Issue - Debugging Guide

## What I've Done

### 1. Fixed OpenAI Error Messages ✅
- Updated error messages to clearly explain that "rate limit exceeded" doesn't mean overuse
- It means the account needs a payment method set up
- Created comprehensive troubleshooting guides

### 2. Fixed API Config Save Logic ✅
- Added proper `onConflict` parameter to the upsert operation
- Added extensive logging throughout the save process
- Improved error handling with detailed error messages

### 3. Added Diagnostic Tools ✅

#### Test Script
- Created `/scripts/test-api-config.mjs` 
- Confirmed the database table exists and works
- Verified that inserts work correctly

#### Debug Endpoint
- Created `/api/settings/api-config/debug`
- Tests authentication, database access, and insert operations
- Returns detailed debug information

#### Debug Button in UI
- Added "🔍 Run Debug Check" button on settings page
- Shows real-time diagnostic information
- Helps identify where the issue is occurring

## How to Debug the Groq Save Issue

### Step 1: Open the Settings Page
1. Go to **Settings > API Configuration**
2. Select **Groq** as provider
3. Enter your Groq API key
4. Open browser console (F12) to see logs

### Step 2: Test Connection
1. Click "Test Connection"
2. Should show success message if Groq API key is valid
3. Check console for logs starting with `[API Config TEST]`

### Step 3: Try to Save
1. Click "Save Configuration"
2. Watch for logs in console starting with `[Settings]` and `[API Config POST]`
3. Note any error messages

### Step 4: Run Debug Check
1. Click "🔍 Run Debug Check" button
2. This will show you:
   - ✅ Authentication status
   - ✅ Database connectivity
   - ✅ Existing configurations
   - ✅ Test insert success/failure

### Step 5: Check the Debug Output

The debug output will tell you exactly what's wrong:

#### If authentication fails:
```json
{
  "error": "Not authenticated",
  "details": {
    "hasAuthData": false,
    "hasUser": false,
    "hasToken": false
  }
}
```
**Solution**: Log out and log back in

#### If database fails:
```json
{
  "database": {
    "tableAccessible": false,
    "testInsert": {
      "success": false,
      "error": "..."
    }
  }
}
```
**Solution**: Run database migrations (see below)

#### If it works:
```json
{
  "success": true,
  "database": {
    "tableAccessible": true,
    "existingConfigs": 1,
    "testInsert": {
      "success": true
    }
  }
}
```
**Issue**: Frontend or auth problem, not database

## Common Issues & Solutions

### Issue 1: "No user found" error

**Symptom**: Console shows `[API Config POST] No user found`

**Cause**: Authentication not working

**Solution**:
1. Log out and log back in
2. Clear cookies
3. Check Clerk configuration in `.env.local`

### Issue 2: "Failed to save configuration" error

**Symptom**: Alert shows "Failed to save configuration"

**Cause**: Database error or RLS policy blocking

**Solution**:
1. Run migrations: `npm run migrate` or use Supabase dashboard
2. Check if table exists in Supabase
3. Verify service role key is correct

### Issue 3: Save appears to work but config doesn't persist

**Symptom**: No error message, but config doesn't appear after refresh

**Cause**: Insert succeeds but is_active not set correctly

**Solution**:
1. Check the database directly in Supabase
2. Look for rows with `is_active = false`
3. Check for multiple rows with same clerk_id/provider

### Issue 4: "Table does not exist" error

**Symptom**: Error about `user_api_configs` table

**Cause**: Migration not applied

**Solution**:
```bash
# Apply the migration
npm run migrate

# Or manually in Supabase SQL editor:
# Run the contents of supabase/migrations/20260210_add_api_keys_and_usage.sql
```

## Testing in Supabase Dashboard

### Check if table exists:
1. Go to Supabase dashboard
2. Go to Table Editor
3. Look for `user_api_configs` table

### Check your configuration:
```sql
SELECT * FROM user_api_configs 
WHERE clerk_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Manual insert test:
```sql
INSERT INTO user_api_configs (clerk_id, provider, api_key, is_active)
VALUES ('your_clerk_user_id', 'groq', 'test_key', true)
ON CONFLICT (clerk_id, provider) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

## What to Check Next

Based on your debug output, here's what to investigate:

### If authentication works:
- ✅ User is logged in correctly
- ➡️ Check database connectivity

### If database is accessible:
- ✅ Table exists
- ✅ Service role key works
- ➡️ Check the actual save operation logs

### If test insert works:
- ✅ Database permissions are correct
- ✅ Table structure is correct
- ➡️ Issue is in the frontend or save logic

## Server Logs to Check

Look for these log patterns in your terminal (where `npm run dev` is running):

```
[API Config POST] Auth methods: { ... }
[API Config POST] Saving config: { userId: '...', provider: 'groq', hasApiKey: true }
[API Config POST] Config saved successfully: { id: '...', provider: 'groq' }
```

If you see errors:
```
[API Config POST] Error saving API config: { ... }
```

## Next Steps

After running the debug check, you'll know exactly what's failing:

1. **Authentication issue** → Check Clerk setup
2. **Database issue** → Run migrations
3. **RLS policy issue** → Check Supabase policies
4. **Frontend issue** → Check browser console logs

## Files Modified

- ✅ `/lib/ai-provider.ts` - Better error messages for OpenAI
- ✅ `/app/api/settings/api-config/route.ts` - Fixed upsert, added logging
- ✅ `/app/api/settings/api-config/test/route.ts` - Better error messages
- ✅ `/app/api/settings/api-config/debug/route.ts` - New debug endpoint
- ✅ `/app/settings/api/page.tsx` - Debug button, better error handling
- ✅ `/scripts/test-api-config.mjs` - Database diagnostic script
- ✅ `/docs/OPENAI_RATE_LIMIT_TROUBLESHOOTING.md` - Detailed OpenAI guide
- ✅ `/OPENAI_RATE_LIMIT_QUICK_FIX.md` - Quick reference for OpenAI issue

## Summary

The database table works correctly (verified with test script). The issue is likely:
1. **Authentication** - User ID not being passed correctly
2. **Frontend** - Save request not being sent properly
3. **Timing** - Save succeeds but UI doesn't update

Use the debug tools to pinpoint the exact issue!
