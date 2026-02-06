# Quick Fix: Enable Email Sign-In (2 Minutes)

## 🎯 The Problem
Email/password authentication is not enabled in your Clerk Dashboard.

## ✅ The Solution (2 Steps)

### Step 1: Go to Clerk Dashboard
👉 https://dashboard.clerk.com/

Select your app: **optimal-swine-59**

### Step 2: Enable Email & Password
1. Click **User & Authentication** (left sidebar)
2. Click **Email, Phone, Username**
3. Toggle these ON:
   - ✅ **Email address**
   - ✅ **Password**
4. Click **Save**

## That's it! 🎉

Now test:
- Go to http://localhost:3000/login
- Sign up with email + password
- Enter verification code (sent to email)
- Done!

## 📌 Important Notes

### Your App Has an Approval System
After sign-in, users need admin approval:
1. User signs in → created with "pending" status
2. Admin approves in admin panel
3. User gets email notification
4. User can now use the app

### To Approve Users:
```
http://localhost:3000/admin
```
Click "Approve" next to pending users.

### Want to Skip Approval?
Edit `app/api/users/register/route.ts` line 63:
```typescript
// Change this:
approved: false,

// To this:
approved: true,
```

## Full Guide
See `FIX_EMAIL_SIGNIN.md` for detailed instructions and troubleshooting.
