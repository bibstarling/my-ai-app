# Landing Page Debug Guide

## Issue
Landing page not loading in production (www.applausejobs.com)

## Quick Fixes to Try

### 1. Clear Browser Cache (Most Common Fix)
**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete` (Windows)
2. Select "Cached images and files"
3. Select "All time"
4. Click "Clear data"
5. Refresh the page

**Or use Incognito/Private mode:**
- `Ctrl + Shift + N` (Chrome/Edge)
- Visit: https://www.applausejobs.com

### 2. Check Browser Console
1. Open the page: https://www.applausejobs.com
2. Press `F12` to open DevTools
3. Click the **Console** tab
4. Look for red errors

**Common errors to look for:**
- `Clerk: Invalid publishable key`
- `Failed to load resource` (from Clerk)
- `CORS error`
- `Failed to fetch`

**Screenshot or copy any errors you see!**

### 3. Verify Clerk Domain in Dashboard

Go to: https://dashboard.clerk.com

#### Check Production Domains
1. Select your Applause app
2. Go to: **Domains** section
3. Make sure these are listed:
   - ✅ `www.applausejobs.com`
   - ✅ `applausejobs.com` (optional)

#### Check CORS Allowed Origins
1. Go to: **API Keys**
2. Click: **Show Advanced**
3. Scroll to: **Allowed Origins**
4. Make sure listed:
   - ✅ `https://www.applausejobs.com`
   - ✅ `http://localhost:3000` (for dev)

#### Check Application URLs
Make sure these match your new domain:
- **Home URL**: `https://www.applausejobs.com`
- **Sign-in URL**: `https://www.applausejobs.com/login`
- **After sign-in**: `https://www.applausejobs.com/dashboard`
- **After sign-up**: `https://www.applausejobs.com/setup`

### 4. Check Network Tab
1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Refresh the page
4. Filter by "clerk" or "auth"
5. Check if requests are:
   - ✅ Status 200 (good)
   - ❌ Status 4xx/5xx (bad - domain mismatch)
   - ❌ (failed) - CORS or network issue

### 5. Verify DNS
Check if the domain is pointing to the right place:

```bash
# In PowerShell
nslookup www.applausejobs.com
```

Should show Vercel's servers.

## Current Code Issue

The landing page (`app/page.tsx`) shows "Loading..." while Clerk initializes:

```typescript
if (!isLoaded) {
  return <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted">Loading...</div>
  </div>;
}
```

If Clerk fails to load, the page gets stuck here forever.

## Potential Fixes

### Option 1: Add Timeout (Quick Fix)
We can add a timeout so if Clerk doesn't load in 10 seconds, show the page anyway:

```typescript
const [showPage, setShowPage] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => {
    setShowPage(true);
  }, 10000); // 10 seconds

  if (isLoaded) {
    clearTimeout(timer);
    setShowPage(true);
  }

  return () => clearTimeout(timer);
}, [isLoaded]);

if (!isLoaded && !showPage) {
  return <div>Loading...</div>;
}
```

### Option 2: Make Landing Page Work Without Clerk
We can make the landing page show even if Clerk fails:

```typescript
// Show page immediately, load auth state in background
const { isSignedIn, isLoaded } = useAuth();

// Use isLoaded to conditionally show auth-dependent UI
<Link href={isLoaded && isSignedIn ? "/dashboard" : "/login"}>
  {isLoaded && isSignedIn ? "Go to Dashboard" : "Get Started"}
</Link>
```

### Option 3: Server-Side Rendering
Convert to Server Component to avoid client-side auth loading:

```typescript
import { auth } from '@clerk/nextjs/server';

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;
  
  // No loading state, page renders immediately
}
```

## What to Check First

1. **Browser console** - Are there Clerk errors?
2. **Network tab** - Are Clerk requests failing?
3. **Incognito mode** - Does it work there? (cache issue)
4. **Clerk dashboard** - Is www.applausejobs.com listed?

## Next Steps

Based on what you find:

### If Console Shows Clerk Errors:
- **"Invalid publishable key"**: Key mismatch in Vercel env vars
- **"CORS error"**: Domain not in Clerk allowed origins
- **"Failed to fetch"**: Network/DNS issue

### If Network Shows 4xx Errors:
- Clerk doesn't recognize the domain
- Need to add www.applausejobs.com to Clerk dashboard

### If It Works in Incognito:
- Clear browser cache
- Or wait for cache to expire (usually 24 hours)

### If Nothing Helps:
We can modify the code to:
1. Remove the loading check (show page immediately)
2. Add a timeout fallback
3. Convert to server component

## Testing Checklist

- [ ] Opened https://www.applausejobs.com in browser
- [ ] Checked browser console for errors
- [ ] Checked Network tab for failed requests
- [ ] Tried incognito/private mode
- [ ] Verified Clerk dashboard has www.applausejobs.com
- [ ] Cleared browser cache
- [ ] Waited 5+ minutes after Vercel deployment

Let me know what you see!
