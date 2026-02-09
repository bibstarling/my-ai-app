# ROOT CAUSE: Clerk Domain Configuration After Domain Change

## The Problem

You mentioned: **"it was working before I changed domains... then we fixed the auth flow, but the API didn't work"**

This is a **classic Clerk domain misconfiguration** issue that happens when you migrate to a new domain.

## What We Discovered

Your Clerk publishable key is: `pk_live_Y2xlcmsuYXBwbGF1c2Vqb2JzLmNvbSQ`

When decoded (base64), this reveals: **`clerk.applausejobs.com`**

This means your Clerk Frontend API (FAPI) is configured to run on a **custom subdomain**: `clerk.applausejobs.com`

## How Clerk Custom Domains Work

### Normal Setup:
- **Main app**: `www.applausejobs.com` or `applausejobs.com`
- **Clerk auth**: `clerk.applausejobs.com` (FAPI subdomain)
- **Cookies**: Set on `.applausejobs.com` (works across all subdomains)

### Why Auth Was Failing:

1. **Frontend auth worked** because it redirects to Clerk's hosted pages
2. **API routes failed with 401** because of cookie domain issues

## The Root Cause

When you changed domains, one of these happened:

1. **Old domain had different Clerk subdomain** (like `accounts.myoldsite.com`)
2. **New Clerk keys generated** but domain DNS not configured yet
3. **Clerk Dashboard not updated** with new production domain
4. **CNAME record missing** for `clerk.applausejobs.com`

## What Needs to be Fixed

### 1. Verify DNS Configuration

You need a CNAME record for your Clerk subdomain:

```dns
clerk.applausejobs.com CNAME clerk.clerkstage.com
```

(The exact CNAME target is shown in your Clerk Dashboard)

### 2. Verify Clerk Dashboard Settings

Go to https://dashboard.clerk.com → Your App → **Domains**

**MUST CHECK:**

- ✅ `applausejobs.com` is listed and verified
- ✅ `www.applausejobs.com` is listed and verified  
- ✅ `clerk.applausejobs.com` is listed and verified (for FAPI)
- ❌ NO `accounts.applausejobs.com` (old default)

### 3. Verify Application URLs

In Clerk Dashboard → **Paths** (or **Application URLs**):

- **Home URL**: `https://www.applausejobs.com` (or `https://applausejobs.com`)
- **Sign-in URL**: `/login`
- **Sign-up URL**: `/login`
- **After sign-in**: `/assistant`
- **After sign-up**: `/assistant`

### 4. Verify CORS Settings

In Clerk Dashboard → **API Keys** → **Advanced** → **CORS Allowed Origins**:

```
https://www.applausejobs.com
https://applausejobs.com
http://localhost:3000
```

## Why This Happened

When you change domains, Clerk needs THREE things updated:

1. **DNS records** - Point `clerk.applausejobs.com` to Clerk's servers
2. **Clerk Dashboard** - Add new domain to allowed domains list
3. **Production keys** - May need to regenerate if domain changed completely

The publishable key (`pk_live_...`) is tied to the domain encoded in it. If you changed from a completely different domain (not just `myoldsite.com` → `applausejobs.com`), you might need NEW production keys.

## Next Steps

1. **Check your DNS** - Does `clerk.applausejobs.com` resolve? Try:
   ```bash
   nslookup clerk.applausejobs.com
   ```

2. **Check Clerk Dashboard** - Follow the checklist above

3. **Test with browser dev tools**:
   - Open https://www.applausejobs.com  
   - Login
   - Check Application → Cookies
   - Look for `__clerk_db_jwt` and `__session` cookies
   - **Domain should be**: `.applausejobs.com` (with leading dot)

4. **If DNS is missing**: You need to add the CNAME record in your DNS provider (Vercel, Cloudflare, etc.)

5. **If Clerk domain is wrong**: You may need to:
   - Update domain in Clerk Dashboard
   - OR regenerate production keys for the new domain
   - OR use Clerk's default `accounts.clerk.dev` subdomain instead

## The Fix We Applied

I've removed the incorrect `domain` prop from `ClerkProvider` (it doesn't exist in the API).

The correct way to configure Clerk domain is through:
- Clerk Dashboard domain settings
- DNS CNAME records  
- NOT through code props

## Current Status

✅ Code is fixed - no invalid props
✅ Environment variables are correct
❌ **Need you to verify**: Clerk Dashboard domain configuration
❌ **Need you to verify**: DNS CNAME record for `clerk.applausejobs.com`

## Quick Diagnostic

Run this in your browser console when on your site:

```javascript
console.log('Clerk cookies:', document.cookie.split(';').filter(c => c.includes('clerk') || c.includes('session')));
console.log('Current domain:', window.location.hostname);
console.log('Clerk key domain:', atob('Y2xlcmsuYXBwbGF1c2Vqb2JzLmNvbSQ'));  // Shows: clerk.applausejobs.com$
```

If cookies are NOT set on `.applausejobs.com`, that's your problem.
