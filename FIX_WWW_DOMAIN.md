# Fix www.applausejobs.com Domain Issue

## Problem
Internal pages showing infinite loading after switching to `www.applausejobs.com`

## Root Cause
Clerk authentication is failing because the new domain isn't fully configured.

## ✅ Fix Steps

### 1. Update Clerk Dashboard (CRITICAL)

Go to [Clerk Dashboard](https://dashboard.clerk.com):

1. **Navigate to your application**
2. **Go to: API Keys** (or Domains section)
3. **Add Production Domain**:
   - Add: `www.applausejobs.com`
   - Ensure `https://www.applausejobs.com` is in allowed origins
4. **Check Home URL**: Should be `https://www.applausejobs.com`
5. **Check Redirect URIs**: Should include:
   - `https://www.applausejobs.com`
   - `https://www.applausejobs.com/*`
   - `https://www.applausejobs.com/api/auth/callback`

### 2. Update Vercel Environment Variables

Run this command to update production environment:

```bash
vercel env add NEXT_PUBLIC_APP_URL production
# When prompted, enter: https://www.applausejobs.com
```

Or via Vercel Dashboard:
1. Go to: https://vercel.com/bibstarling-gmailcoms-projects/applausejobs
2. Click: **Settings** → **Environment Variables**
3. Find: `NEXT_PUBLIC_APP_URL`
4. Update to: `https://www.applausejobs.com`
5. Click: **Save**

### 3. Redeploy

After updating Clerk and Vercel environment variables:

```bash
vercel --prod
```

## 🔍 Verify Clerk Configuration

Your Clerk dashboard should have these settings:

### Application URLs
- **Home URL**: `https://www.applausejobs.com`
- **Sign-in URL**: `https://www.applausejobs.com/login`
- **Sign-up URL**: `https://www.applausejobs.com/login`
- **After sign-in URL**: `https://www.applausejobs.com/dashboard`
- **After sign-up URL**: `https://www.applausejobs.com/setup`

### Allowed Origins (CORS)
Make sure these are added:
- ✅ `https://www.applausejobs.com`
- ✅ `http://localhost:3000` (for local development)

### Session Management
- **Session lifetime**: 7 days (default)
- **Multi-session**: Enabled
- **Secure cookies**: Enabled (HTTPS only)

## 🧪 Test After Changes

### Local Testing
1. Update `.env.local` (already done ✅)
2. Restart dev server:
   ```bash
   npm run dev
   ```
3. Visit: http://localhost:3000/dashboard
4. Should load without infinite spinner

### Production Testing
1. Clear browser cache or use incognito
2. Visit: https://www.applausejobs.com
3. Sign in
4. Navigate to /dashboard
5. Should load immediately

## 🚨 If Still Not Working

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors like:
   - "Clerk: Invalid domain"
   - "CORS error"
   - "Failed to fetch"
4. Share the error message

### Check Network Tab
1. Open DevTools → **Network** tab
2. Reload the page
3. Look for failed requests to Clerk
4. Check if auth endpoints are returning 4xx errors

### Verify Domain DNS
Make sure `www.applausejobs.com` points to Vercel:
1. Check DNS records
2. Should be a CNAME pointing to `cname.vercel-dns.com`

## 📝 Quick Checklist

- [ ] Clerk Dashboard: Added `www.applausejobs.com` to allowed domains
- [ ] Clerk Dashboard: Updated Home URL to `https://www.applausejobs.com`
- [ ] Clerk Dashboard: Added to Allowed Origins (CORS)
- [ ] Vercel: Updated `NEXT_PUBLIC_APP_URL` environment variable
- [ ] Vercel: Redeployed to production (`vercel --prod`)
- [ ] Browser: Cleared cache or tested in incognito
- [ ] Test: Can sign in and access internal pages

## 🎯 Expected Behavior After Fix

### Landing Page (/)
- ✅ Visible to all users (logged in or out)
- ✅ "Sign In" + "Get Started" buttons when logged out
- ✅ "Go to Dashboard" button when logged in

### Internal Pages (/dashboard, /assistant, etc.)
- ✅ Load immediately without spinner
- ✅ Show content properly
- ✅ Auth works correctly

## 💡 Alternative Quick Fix

If you want BOTH domains to work:

In Clerk, add both:
- `applausejobs.com`
- `www.applausejobs.com`

Then in Vercel, set up redirect:
- Redirect `applausejobs.com` → `www.applausejobs.com`
- Or vice versa

## 📞 Need More Help?

If still having issues, check:
1. Clerk Dashboard → Logs (shows auth failures)
2. Vercel Dashboard → Logs (shows app errors)
3. Browser Console → Errors

Let me know what you see!
