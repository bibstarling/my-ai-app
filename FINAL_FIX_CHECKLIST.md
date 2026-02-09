# FINAL FIX CHECKLIST - Cookie Domain Issue

## ✅ What We Fixed in Code

1. ✅ Changed `NEXT_PUBLIC_APP_URL` from `https://www.applausejobs.com` to `https://applausejobs.com`
2. ✅ Updated `proxy.ts` with proper Clerk configuration
3. ✅ Deployed to production

## 🔧 MANUAL STEPS REQUIRED

### Step 1: Update Clerk Dashboard → Paths

Go to: https://dashboard.clerk.com → Your App → Configure → Developers → **Paths**

**Change these two URLs** (remove `www.`):

- **Home URL**: 
  - ❌ Current: `www.applausejobs.com`
  - ✅ Change to: `applausejobs.com`

- **Signing Out → Path on application domain**:
  - ❌ Current: `www.applausejobs.com`  
  - ✅ Change to: `applausejobs.com`

**Leave these as-is** (already correct):
- Sign-in: `applausejobs.com/login` ✓
- Sign-up: `applausejobs.com/login` ✓

### Step 2: Add Environment Variable to Vercel

Go to: https://vercel.com/bibstarling-gmailcoms-projects/applausejobs/settings/environment-variables

**Add new variable:**
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://applausejobs.com`
- **Environment**: Production, Preview, Development (select all)

### Step 3: Redeploy (trigger automatically after env var added)

Vercel will automatically redeploy after you add the environment variable.

If not, go to: https://vercel.com/bibstarling-gmailcoms-projects/applausejobs/deployments

Find the latest deployment and click **"Redeploy"**

---

## 🎯 Why This Fixes Everything

### The Problem:
```
Browser visits:      applausejobs.com
Cookies set on:      applausejobs.com (no leading dot)
App expected:        www.applausejobs.com
Result:              Cookie not accessible → 401 Unauthorized
```

### The Solution:
```
Browser visits:      applausejobs.com
Cookies set on:      applausejobs.com
App expects:         applausejobs.com
Result:              Cookie accessible → Authentication works! ✅
```

---

## 🧪 Testing After Fix

1. **Clear browser cookies** for applausejobs.com
2. Visit `https://applausejobs.com` (without www)
3. Log in
4. Try generating tailored resume/cover letter
5. Check browser DevTools → Application → Cookies
   - Should see `__session` cookie on `applausejobs.com`
6. API calls should now work!

---

## 📊 Before vs After

### BEFORE (Broken):
- Vercel domain: `applausejobs.com`
- App config: `www.applausejobs.com` ❌ **MISMATCH**
- Clerk paths: Mix of both ❌ **INCONSISTENT**
- Cookie domain: `applausejobs.com`
- API auth: ❌ **FAILS** (cookie not accessible)

### AFTER (Fixed):
- Vercel domain: `applausejobs.com` ✅
- App config: `applausejobs.com` ✅ **MATCH**
- Clerk paths: All `applausejobs.com` ✅ **CONSISTENT**
- Cookie domain: `applausejobs.com`
- API auth: ✅ **WORKS** (cookie accessible)

---

## 🔄 Alternative: Use www Everywhere

If you prefer `www.applausejobs.com`, you would need to:

1. Add `www.applausejobs.com` as a domain in Vercel
2. Set up redirect from `applausejobs.com` → `www.applausejobs.com`
3. Update ALL Clerk paths to use `www.`
4. Use `https://www.applausejobs.com` as `NEXT_PUBLIC_APP_URL`

**Current approach (no www) is simpler!**

---

## ✅ Completion Checklist

- [ ] Updated Clerk Dashboard → Paths (Home URL and Sign-out)
- [ ] Added `NEXT_PUBLIC_APP_URL` to Vercel environment variables
- [ ] Redeployed application
- [ ] Cleared browser cookies
- [ ] Tested login + API calls (tailored content generation)
- [ ] Verified `__session` cookie appears in DevTools

---

## 🆘 If Still Not Working

1. **Check cookie domain in DevTools**:
   - Should be: `applausejobs.com` (exact match)
   - Location: DevTools → Application → Cookies → `https://applausejobs.com`

2. **Check you're visiting the right URL**:
   - Use: `https://applausejobs.com` ✅
   - NOT: `https://www.applausejobs.com` ❌

3. **Check Vercel environment variable was added**:
   - Should see `NEXT_PUBLIC_APP_URL=https://applausejobs.com` in deployment logs

4. **Check runtime logs** for any errors:
   - Vercel Dashboard → Deployments → Latest → Runtime Logs

5. **Force hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
