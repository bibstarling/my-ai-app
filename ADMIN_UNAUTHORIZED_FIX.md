# Admin Unauthorized Issue - Fix Guide

## Problem
Your admin area at `/admin` is throwing an "Unauthorized" error.

## Root Cause
The issue occurs when:
1. You're not logged in to Clerk
2. You're logged in with a different Clerk account than the one in the database
3. Your Clerk session is not being passed correctly to the API routes
4. Your user doesn't exist in the database or doesn't have `is_admin: true`

## Quick Fix

### Option 1: Use the Debug Page (Recommended)
I've created a debug page to help you diagnose and fix the issue:

1. Make sure you're logged in to Clerk
2. Visit: `http://localhost:3000/admin/debug` (or your dev server URL)
3. Check the information displayed
4. If you're logged in with `bibstarling@gmail.com`, click **"Grant Admin Access"**
5. Go back to `/admin` - it should work now!

### Option 2: Check Browser Console
1. Open the admin page: `http://localhost:3000/admin`
2. Press `F12` to open Developer Tools
3. Go to the Console tab
4. Look for log messages starting with `[Admin Check]` or `[Admin API]`
5. Check if your email matches `bibstarling@gmail.com`
6. Check if your Clerk ID matches `user_39CoRgDkrv6DjDuJZmbqBPNxyoK`

### Option 3: Direct API Call
You can also grant yourself admin access via curl:

```bash
# First, log in to your app and get your session
# Then run this:
curl -X POST http://localhost:3000/api/admin/grant-self \
  -H "Cookie: <your-session-cookie>"
```

## What I Fixed

### 1. Enhanced API Error Handling
Updated `/api/users/list` to:
- Add detailed logging
- Show specific error messages
- Use fallback auth methods
- Provide better debugging information

### 2. Improved Admin Page
Updated `/app/admin/page.tsx` to:
- Log authentication details to console
- Display error messages with user info
- Show your current email and Clerk ID when unauthorized

### 3. Created Debug Tools

**Debug Page**: `/admin/debug`
- Shows your current Clerk authentication status
- Displays API authentication details
- Allows you to grant yourself admin access with one click

**Debug API**: `/api/debug-auth`
- Returns your current Clerk session info
- Useful for testing authentication

**Grant Self API**: `/api/admin/grant-self`
- Automatically grants admin access if you have the admin email
- Creates or updates your user in the database

**Ensure Admin Script**: `scripts/ensure-admin.ts`
- Command-line tool to grant admin access
- Run with: `npx tsx scripts/ensure-admin.ts`

## Verification

After fixing, verify that:
1. You can access `/admin` without errors
2. You see the admin dashboard with user list
3. No "Unauthorized" or "Forbidden" messages appear

## Database Status

Your admin user is correctly configured in the database:
- Email: `bibstarling@gmail.com`
- Clerk ID: `user_39CoRgDkrv6DjDuJZmbqBPNxyoK`
- Admin: `true`
- Approved: `true`

## Common Issues

### "Unauthorized" Error
- **Cause**: Not logged in or Clerk session not working
- **Fix**: Make sure you're logged in at `/login` first

### "User not found in database"
- **Cause**: Your Clerk account isn't registered in the database
- **Fix**: Visit `/admin/debug` and click "Grant Admin Access"

### "Forbidden: Admin access required"
- **Cause**: Your user exists but `is_admin` is `false`
- **Fix**: Visit `/admin/debug` and click "Grant Admin Access"

### Clerk ID Mismatch
- **Cause**: Logged in with different account than expected
- **Fix**: 
  1. Log out
  2. Log in with `bibstarling@gmail.com`
  3. Visit `/admin/debug` and grant access

## Testing

1. Open incognito window
2. Visit your app
3. Click "Sign In" and log in with your admin email
4. Go to `/admin/debug` - should see your info
5. Click "Grant Admin Access" if needed
6. Go to `/admin` - should see admin dashboard

## Support

If the issue persists:
1. Check browser console for error messages
2. Check terminal/server logs for API errors
3. Verify environment variables are set:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
