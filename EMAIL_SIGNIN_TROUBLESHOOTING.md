# Email Sign-In Troubleshooting Guide

## Issue: Email Sign-In UI Not Working

Since you confirmed email/password is already enabled in Clerk Dashboard, the issue is with the frontend implementation.

## ✅ Quick Fix Applied

I've updated the login page configuration to:
1. Better width handling for the Clerk component
2. Explicit redirect URLs for sign-up flow
3. Added social buttons at the top
4. Added a helpful hint for new users
5. Improved styling for better visibility

## 🧪 Testing Steps

### Step 1: Clear Cache and Test
```bash
# 1. Stop your dev server (Ctrl+C)
# 2. Clear Next.js cache
rm -rf .next

# 3. Restart
npm run dev
```

### Step 2: Test the Sign-In Flow
1. Go to: http://localhost:3000/login
2. You should see:
   - ✅ Google sign-in button (at top)
   - ✅ Email input field
   - ✅ Password input field
   - ✅ "Don't have an account? Sign up" link

### Step 3: Test Sign-Up Flow
1. Click "Don't have an account? Sign up" at the bottom of the form
2. You should see the sign-up form with:
   - ✅ Email address field
   - ✅ Password field (with requirements)
   - ✅ Or "Continue with Google" option

### Step 4: Complete Sign-Up
1. Enter email and password
2. You'll receive a verification code email
3. Enter the code
4. You'll be redirected to `/dashboard`
5. Admin needs to approve your account

## 🔍 Common Issues & Solutions

### Issue 1: Email Fields Not Showing
**Symptoms**: Only see Google sign-in button, no email fields

**Solution**:
1. Check Clerk Dashboard → User & Authentication → Email, Phone, Username
2. Ensure these are ON:
   - ✅ Email address
   - ✅ Password
3. Under "Authentication strategies", verify:
   - ✅ Email verification code (recommended)
   OR
   - ✅ Email verification link

**If still not showing**, check browser console (F12) for errors.

### Issue 2: "Don't have an account?" Link Not Visible
**Symptoms**: Can't find the sign-up link

**Look for**: 
- Link is at the BOTTOM of the Clerk form
- Text is styled with your accent color
- If using dark mode, make sure it's visible

**Alternative**: Add a direct sign-up link above the form (see code below)

### Issue 3: Sign-Up Form Shows But Doesn't Submit
**Symptoms**: Form validates but nothing happens on submit

**Solution**:
1. Check browser console (F12) for JavaScript errors
2. Verify your Clerk keys in `.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. Make sure keys are from the correct Clerk application
4. Restart dev server after any `.env.local` changes

### Issue 4: Stuck on Verification Step
**Symptoms**: Email sent but can't proceed

**Solution**:
1. Check spam folder for verification code email
2. Code expires after 10 minutes - request a new one
3. Check Clerk Dashboard → Logs for delivery status
4. Verify email provider isn't blocking Clerk emails

### Issue 5: "Invalid Configuration" Error
**Symptoms**: Error message about routing or configuration

**Solution**:
1. Verify the catch-all route exists: `app/login/[[...rest]]/page.tsx`
2. Check that `routing="path"` and `path="/login"` match
3. Ensure no other routes conflict with `/login`

## 🔧 Advanced Debugging

### Enable Clerk Debug Mode
Add this to your login page temporarily:

```typescript
<SignIn
  appearance={{...}}
  routing="path"
  path="/login"
  // Add this for debugging:
  __experimental_ClerkDevMode={true}
/>
```

### Check Network Tab
1. Open DevTools (F12) → Network tab
2. Try to sign up
3. Look for requests to Clerk's API
4. Check if they're returning errors (status 400, 500, etc.)

### Console Logging
Add this at the top of your login page component:

```typescript
useEffect(() => {
  console.log('Clerk Keys:', {
    publishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
    hasSecret: !!process.env.CLERK_SECRET_KEY,
  });
}, []);
```

## 🎯 Still Not Working?

### Option A: Use Separate Sign-In/Sign-Up Pages

If the combined flow isn't working, split them:

1. Create `app/sign-up/[[...rest]]/page.tsx`:
```typescript
'use client';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/login"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
```

2. Update login page to use `signUpUrl="/sign-up"`

### Option B: Use Modal Mode

Change the login approach to use modal instead of path:

```typescript
import { SignInButton } from '@clerk/nextjs';

<SignInButton mode="modal">
  <button>Sign In / Sign Up</button>
</SignInButton>
```

## 📊 Verification Checklist

After applying fixes, verify:
- [ ] Email input field is visible
- [ ] Password input field is visible
- [ ] Google sign-in button is visible
- [ ] "Sign up" link is visible and clickable
- [ ] Clicking "Sign up" switches to sign-up form
- [ ] Sign-up form can be submitted
- [ ] Verification code email is received
- [ ] After verification, user is created in database
- [ ] Admin can see and approve the user

## 🆘 Get Clerk Logs

To see what Clerk is doing:
1. Go to: https://dashboard.clerk.com/
2. Select your app: **optimal-swine-59**
3. Click **Logs** in the sidebar
4. Filter by "Sign-ups" or "Errors"
5. This will show you exactly what's failing

## 💡 Expected Behavior

**Correct Flow**:
1. User visits `/login`
2. Sees email + password fields (or Google button)
3. Clicks "Don't have an account? Sign up"
4. Form switches to sign-up mode (same page)
5. User enters email + password
6. Clerk sends verification code
7. User enters code
8. User is created in your database via `/api/users/settings`
9. User redirected to `/dashboard`
10. Admin approves in admin panel

If any step fails, check the corresponding section above.
