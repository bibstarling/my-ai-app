# Fix Clerk Domain Configuration

## Problem
Authentication is redirecting to `accounts.applausejobs.com` instead of using `www.applausejobs.com/login`.

## Solution

### 1. Update Vercel Environment Variables

Go to [Vercel Project Settings](https://vercel.com/bibstarling-gmailcoms-projects/applausejobs/settings/environment-variables) and add these:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/assistant
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/assistant
```

**Important:** Set these for **Production**, **Preview**, AND **Development** environments.

### 2. Update Clerk Dashboard

Go to [Clerk Dashboard](https://dashboard.clerk.com) → Your App → **Paths**:

1. Set "Sign-in" to: `/login`
2. Set "Sign-up" to: `/login`
3. Set "After sign-in" to: `/assistant`
4. Set "After sign-up" to: `/assistant`

### 3. Check Clerk Domain Settings

In Clerk Dashboard → **Domains**:

1. **Remove** any domain that says `accounts.applausejobs.com`
2. Make sure `www.applausejobs.com` is listed as the **primary production domain**
3. Your home URL should be: `https://www.applausejobs.com`

### 4. Redeploy

After making these changes in Vercel, redeploy your app:

```bash
git commit --allow-empty -m "Trigger redeploy with new Clerk env vars"
git push
```

## Why This Happened

Clerk defaults to using an `accounts.*` subdomain for hosted authentication pages. By setting these environment variables, we tell Clerk to use our app's own `/login` route instead.
