# Fix Email/Password Sign-In

## Problem
Users cannot sign in with email and password - this feature needs to be enabled in Clerk Dashboard.

## Solution: Enable Email & Password Authentication

### Step 1: Enable Email Authentication in Clerk

1. Go to your Clerk Dashboard: https://dashboard.clerk.com/
2. Select your application: **optimal-swine-59** (based on your publishable key)
3. Navigate to: **User & Authentication** → **Email, Phone, Username**
4. Enable these settings:
   - ✅ **Email address** (toggle on)
   - ✅ **Require email address** (if you want it mandatory)
5. Click **Save**

### Step 2: Enable Password Authentication

1. Still in **User & Authentication**, go to **Email, Phone, Username**
2. Scroll down to **Password** section
3. Enable:
   - ✅ **Password** (toggle on)
   - ✅ **Allow sign ups with password**
   - ✅ **Require password**
4. Configure password requirements (recommended):
   - Minimum length: 8 characters
   - Require uppercase, lowercase, numbers, special characters (optional)
5. Click **Save**

### Step 3: Configure Email Settings

1. Go to **User & Authentication** → **Email & SMS**
2. Set up email verification method:
   - **Email verification code (OTP)** - Recommended (most user-friendly)
   - OR **Email verification link**
3. Configure email templates if needed
4. Click **Save**

### Step 4: Verify Sign-In Methods

1. Go to **User & Authentication** → **Sign-up and sign-in options**
2. Verify these are enabled:
   - ✅ Email + Password
   - ✅ Google OAuth (already working)
3. You can also enable:
   - Email magic links (passwordless)
   - Other OAuth providers (GitHub, Microsoft, etc.)

## Test the Fix

After enabling email authentication:

1. Clear your browser cache/cookies
2. Go to: http://localhost:3000/login
3. Try signing up with a test email and password
4. You should receive a verification code email
5. Enter the code to complete sign-up
6. User will be created and need admin approval (as designed)

## What Authentication Methods Are Now Available

After this fix, users can sign in with:
- ✅ Email + Password (newly enabled)
- ✅ Google OAuth (already working)
- ✅ Email magic links (if you enable it)

## Common Issues & Solutions

### Issue: "Email verification required"
**Solution**: This is normal. Clerk sends a verification code to the email. User must enter it to complete sign-up.

### Issue: Still can't sign in with email
**Checklist**:
1. Did you save all changes in Clerk Dashboard?
2. Did you refresh your app (hard reload: Ctrl+Shift+R)?
3. Check Clerk Dashboard → Logs for error messages
4. Verify your `.env.local` has correct Clerk keys

### Issue: User signs in but can't access features
**This is intentional** - Your app has an approval system. After sign-in:
1. User is created with `approved: false`
2. Admin must approve them in the admin panel
3. User receives approval email
4. Then they can fully use the app

To approve users:
1. Go to: http://localhost:3000/admin
2. Click "Approve" next to pending users
3. User receives confirmation email

## Remove Approval System (Optional)

If you want to let users access the app immediately without approval:

1. Open: `app/api/users/register/route.ts`
2. Change line 63 from:
   ```typescript
   approved: false, // Will be approved by admin
   ```
   to:
   ```typescript
   approved: true, // Auto-approve all users
   ```

**Security Note**: Only do this if you're comfortable with anyone who signs up having immediate access.

## Need More Help?

### Check Clerk Logs
Go to Clerk Dashboard → Logs to see detailed error messages when sign-in fails.

### Test in Incognito
Try signing up in an incognito/private browser window to avoid cache issues.

### Verify Environment Variables
Make sure these are in your `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_b3B0aW1hbC1zd2luZS01OS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_5xIbBGUAVDIKaIPI3mjz2lCuXEosBKBSsHLk4uiTqb
```

## Related Documentation

- [Clerk Email/Password Guide](https://clerk.com/docs/custom-flows/email-password)
- [Next.js Clerk Integration](https://clerk.com/docs/nextjs)
- Your approval system docs: `BUG_FIXES_2026-02-11.md`
