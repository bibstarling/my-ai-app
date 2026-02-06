# Clerk Login Issue - Troubleshooting Guide

## Problem
Login page at `/login` not loading in production (www.applausejobs.com)

## Root Cause
When you changed domains from `applausejobs.com` to `www.applausejobs.com`, Clerk needs specific configuration updates to work properly with the new domain.

## Critical: Verify Clerk Dashboard Settings

### 1. Go to Clerk Dashboard
Visit: https://dashboard.clerk.com

### 2. Select Your Applause Application

### 3. Check Domain Configuration

#### Navigate to: Domains
You need to ensure `www.applausejobs.com` is added as an authorized domain.

**Required Settings:**
- ✅ Production Domain: `www.applausejobs.com`
- ✅ Also add (optional but recommended): `applausejobs.com`

#### Navigate to: API Keys → Advanced → Allowed Origins (CORS)
Make sure these origins are listed:
- ✅ `https://www.applausejobs.com`
- ✅ `https://applausejobs.com` (optional)
- ✅ `http://localhost:3000` (for development)

### 4. Check Application URLs

Go to: **Paths** (or **Application** section)

Update ALL these URLs to use the www subdomain:

**Required URLs:**
- **Home URL**: `https://www.applausejobs.com`
- **Sign-in URL**: `https://www.applausejobs.com/login`
- **Sign-up URL**: `https://www.applausejobs.com/login`
- **After sign-in URL**: `https://www.applausejobs.com/dashboard`
- **After sign-up URL**: `https://www.applausejobs.com/setup`

### 5. Check Publishable Key Domain

Important: The publishable key (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) must match your application instance.

If you created a NEW Clerk application for the new domain:
- You need to update the keys in Vercel environment variables
- Old keys from a different Clerk app won't work

## Testing the Fix

### After Updating Clerk Dashboard

1. **Wait 1-2 minutes** for Clerk changes to propagate
2. **Clear browser cache** or use incognito mode
3. Visit: https://www.applausejobs.com/login

### What You Should See

**If Working:**
- ✅ Loading spinner briefly
- ✅ Then Clerk sign-in form appears
- ✅ Social login buttons (Google, GitHub, etc.)
- ✅ Email/password fields
- ✅ "Don't have an account? Sign up" link

**If Still Broken:**
- ❌ Infinite loading spinner
- ❌ Or red error box: "Authentication Service Error"
- ❌ Or blank white screen

### Debug in Browser Console

1. Open https://www.applausejobs.com/login
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for errors:

**Common Clerk Errors:**

```
❌ Clerk: Invalid publishable key
→ Fix: Update Vercel env vars with correct key

❌ Clerk: Origin not allowed
→ Fix: Add www.applausejobs.com to Clerk CORS settings

❌ Failed to load resource: clerk.*.clerk.accounts.dev
→ Fix: Domain/API key mismatch

❌ ERR_BLOCKED_BY_RESPONSE
→ Fix: CORS issue, check Clerk allowed origins
```

### Check Network Tab

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Refresh the page
4. Filter by "clerk"
5. Check status codes:
   - ✅ 200 = Working
   - ❌ 401/403 = Authorization issue (domain not allowed)
   - ❌ 404 = Wrong endpoint (key mismatch)
   - ❌ CORS = Origin not in allowed list

## Environment Variables Check

Verify your production environment variables in Vercel:

```bash
vercel env ls
```

**Required Variables:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Must be set for Production
- `CLERK_SECRET_KEY` - Must be set for Production
- `NEXT_PUBLIC_APP_URL` - Should be `https://www.applausejobs.com`

**To update if wrong:**

```bash
# Remove old value
vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production

# Add new value (copy from Clerk Dashboard → API Keys)
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# When prompted, paste: pk_live_... or pk_test_...

# Redeploy
vercel --prod
```

## Code Changes Made

I've added better error handling to the login page:

1. **Loading State**: Shows spinner while Clerk loads
2. **Error State**: Shows clear error if Clerk fails to load after 10 seconds
3. **Retry Button**: Allows user to refresh and try again

## Clerk Dashboard Checklist

- [ ] Logged into https://dashboard.clerk.com
- [ ] Selected correct Applause application
- [ ] Added `www.applausejobs.com` to Domains
- [ ] Added `https://www.applausejobs.com` to Allowed Origins (CORS)
- [ ] Updated Home URL to `https://www.applausejobs.com`
- [ ] Updated Sign-in URL to `https://www.applausejobs.com/login`
- [ ] Updated After sign-in URL to `https://www.applausejobs.com/dashboard`
- [ ] Waited 1-2 minutes for changes to propagate
- [ ] Tested in incognito mode
- [ ] Checked browser console for errors

## Still Not Working?

### Option 1: Temporarily Use Non-WWW
If urgent, you can redirect www → non-www:
1. In Vercel Dashboard → Domains
2. Set up redirect: `www.applausejobs.com` → `applausejobs.com`
3. Update Clerk to use `applausejobs.com` (without www)

### Option 2: Verify Clerk Instance
Check if you accidentally have multiple Clerk applications:
1. Clerk Dashboard → Applications (top left)
2. Make sure you're configuring the CORRECT app
3. The publishable key in your .env should match the app you're configuring

### Option 3: Recreate Clerk Keys
If nothing works:
1. Clerk Dashboard → API Keys
2. Generate new keys
3. Update Vercel environment variables
4. Redeploy

### Option 4: Contact Clerk Support
If domain still not working:
1. Clerk Dashboard → Support
2. Mention: "Domain change from applausejobs.com to www.applausejobs.com"
3. Share: Publishable key prefix and domain

## Testing Commands

```bash
# Check if domain resolves correctly
nslookup www.applausejobs.com

# Check SSL certificate
curl -I https://www.applausejobs.com

# Check environment variables
vercel env ls

# Pull production env vars locally
vercel env pull .env.production

# Redeploy to production
vercel --prod
```

## Expected Timeline

- **Clerk Dashboard Changes**: Instant (1-2 min to propagate)
- **Vercel Environment Update**: Requires redeploy (~1 min)
- **DNS Changes**: If you made DNS changes (2-48 hours, usually faster)
- **Browser Cache**: Clear it or wait 24 hours

## Success Indicators

✅ Login page shows Clerk form immediately
✅ Can click social login buttons
✅ Can enter email/password
✅ Can create new account
✅ After sign in, redirects to /dashboard
✅ No errors in browser console
✅ No failed network requests to Clerk

## Quick Test Script

```javascript
// Paste in browser console on www.applausejobs.com/login
console.log('Testing Clerk...');
console.log('Current origin:', window.location.origin);
console.log('Expected:', 'https://www.applausejobs.com');

// Check if Clerk loaded
setTimeout(() => {
  if (window.Clerk) {
    console.log('✅ Clerk loaded successfully');
    console.log('Clerk instance:', window.Clerk);
  } else {
    console.error('❌ Clerk failed to load');
    console.log('Check:');
    console.log('1. Domain in Clerk dashboard');
    console.log('2. CORS allowed origins');
    console.log('3. API keys in Vercel');
  }
}, 5000);
```

---

Let me know what you see in the browser console and I can help debug further!
