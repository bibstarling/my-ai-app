# Fix Google Sign-In Bugs - Action Plan

## Summary of Issues & Fixes
✅ **Fixed**: Email not being saved when users sign in with Google  
✅ **Fixed**: Users not visible in admin area due to security issues  
✅ **Fixed**: Improved database security with proper RLS policies

## What Was Wrong

### Bug 1: Email Not Saved
The `/api/users/settings` endpoint was creating users without fetching their email from Clerk. This endpoint is called during onboarding and is often the first API call that creates a user record.

### Bug 2: User Not Visible in Admin
The admin page was using an insecure client-side Supabase connection with overly permissive RLS policies. This has been fixed to use proper API endpoints.

## Steps to Apply the Fix

### Step 1: Apply the Database Migration

You need to apply the new migration to fix the RLS policies.

**Option A: Manual (Recommended)**
1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/qtplretigutndftokplk/sql/new
2. Copy the contents of `supabase/migrations/20260211_fix_users_rls.sql`
3. Paste and run it in the SQL editor

**Option B: Using Script**
```bash
node scripts/run-migrations.mjs
```

### Step 2: Fix Existing User's Email

Your friend's user was created without an email. You need to backfill it.

1. Start your dev server:
```bash
npm run dev
```

2. Sign in as admin (with your bibstarling@gmail.com account)

3. Call the sync-emails endpoint by opening this URL:
```
http://localhost:3000/api/users/sync-emails
```
Make a POST request (you can use a browser extension or just visit the admin area and open the browser console):

```javascript
// In browser console:
fetch('/api/users/sync-emails', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

This will:
- Find all users without emails
- Fetch their emails from Clerk
- Update the database

### Step 3: Verify the Fix

1. Go to the admin area: http://localhost:3000/admin
2. You should now see your friend's user with their email
3. Their account can now be managed normally

### Step 4: Test New Sign-Ins

1. Have your friend sign out and sign back in with Google
2. Check the admin area - their email should be saved correctly
3. Try signing in with a test Google account to verify

## What Changed (Technical Details)

### Files Modified:
1. **`app/api/users/settings/route.ts`**
   - Now fetches email from Clerk in GET, POST, and PATCH methods
   - Includes email in all insert/upsert operations

2. **`app/admin/page.tsx`**
   - Uses API endpoints instead of direct Supabase queries
   - More secure and reliable

### Files Created:
1. **`app/api/users/sync-emails/route.ts`**
   - Admin-only endpoint to backfill emails for existing users

2. **`app/api/users/update/route.ts`**
   - Admin endpoint to safely update user properties

3. **`supabase/migrations/20260211_fix_users_rls.sql`**
   - Proper RLS policies for the users table
   - More secure than the previous USING (true) policies

## Security Improvements

The previous RLS policies were:
```sql
USING (true)  -- ❌ Anyone could read/manage all users!
```

New RLS policies are:
```sql
-- ✅ Users can only read/update their own data
-- ✅ Admin operations use service role (bypasses RLS)
-- ✅ Frontend admin page uses secure API endpoints
```

## Future Prevention

Going forward:
- All user creation/updates now capture emails automatically
- Admin operations use secure backend endpoints
- Database has proper security policies

## Troubleshooting

**If users still don't appear in admin:**
1. Check browser console for errors
2. Verify the migration was applied successfully
3. Confirm you're signed in with the admin account

**If email sync fails:**
1. Check that the user exists in Clerk
2. Verify the Clerk user has an email address
3. Check server logs for detailed error messages

**If you see RLS policy errors:**
1. Make sure the migration was applied
2. Restart your dev server
3. Check that you're using the correct Supabase keys in `.env.local`

## Need Help?

Check the detailed bug report in `BUG_FIXES_2026-02-11.md` for more information about what was changed and why.
