# Enable Email Sign-Up in Clerk

## Current Issue
Users can't sign up with email/password. This is a Clerk dashboard configuration issue.

## Fix: Enable Email/Password Authentication

### Step 1: Go to Clerk Dashboard
1. Visit [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your **applausejobs.com** application

### Step 2: Enable Email Authentication
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Under **Contact information**, make sure **Email address** is enabled:
   - Toggle it **ON** if it's off
   - Set it to **Required**
3. Click **Save**

### Step 3: Enable Password Authentication
1. In the same **User & Authentication** section
2. Go to **Authentication strategies** (or **Password**)
3. Enable **Password** authentication:
   - Toggle **Password** to **ON**
   - For "Email address", make sure it's set to **Required** or **Optional**
4. Click **Save**

### Step 4: Configure Email Verification (Optional but Recommended)
1. Go to **Email, Phone, Username** settings
2. Under **Email address**, set verification:
   - **Verification methods**: Email code (recommended)
   - **Verification required**: Toggle ON
3. Click **Save**

### Step 5: Configure Social Logins (Optional)
If you want to keep Google/GitHub sign-in:
1. Go to **User & Authentication** → **Social Connections**
2. Enable the ones you want:
   - **Google** (most popular)
   - **GitHub** (for developers)
   - **LinkedIn** (professional network)
3. Configure OAuth credentials for each provider

### Step 6: Test the Sign-Up Flow
1. Go to `https://www.applausejobs.com/login`
2. You should see:
   - Email input field
   - Password input field
   - "Don't have an account? Sign up" link at the bottom
3. Click **Sign up** and test creating a new account

## Expected Result

After enabling email/password auth, users should see:
- Email input
- Password input
- "Create account" or "Sign up" button
- Option to switch between "Sign in" and "Sign up"

## Common Issues

### Issue: "Sign up" link is not visible
**Solution**: The `SignIn` component automatically shows a "Don't have an account? Sign up" link when:
- Email/Password auth is enabled in Clerk
- The component has `signUpUrl` prop (already configured in your code)

### Issue: Email verification not working
**Solution**: Check your Clerk email settings:
- Go to **Customization** → **Email**
- Make sure email templates are configured
- Test email delivery

### Issue: Users get "Authentication method not available"
**Solution**: 
- Make sure **Password** is enabled in Clerk dashboard
- Verify that email address is set as a **Required** field

## Your Current Configuration

Your code already has the correct setup:
```tsx
<SignIn
  signUpUrl="/login"  // ✅ Allows sign-up on the same page
  forceRedirectUrl="/dashboard"  // ✅ Redirects to dashboard after sign-up
/>
```

The only missing piece is the Clerk dashboard configuration!
