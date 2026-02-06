# 📧 Email System Setup Checklist

Quick checklist to get your email system up and running in 5 minutes!

## ✅ Setup Steps

### Step 1: Create Resend Account (2 minutes)
- [ ] Go to [resend.com](https://resend.com)
- [ ] Click "Sign Up" and create account
- [ ] Verify your email address
- [ ] Log in to dashboard

### Step 2: Get API Key (1 minute)
- [ ] Navigate to "API Keys" in sidebar
- [ ] Click "Create API Key"
- [ ] Name it: "My AI App Development"
- [ ] Copy the API key (starts with `re_`)

### Step 3: Add Environment Variables (1 minute)
- [ ] Open `.env.local` file
- [ ] Add these lines:
```bash
RESEND_API_KEY=re_paste_your_key_here
EMAIL_FROM=My AI App <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
- [ ] Save the file

### Step 4: Restart Server (1 minute)
- [ ] Stop your dev server (Ctrl+C)
- [ ] Run `npm run dev`
- [ ] Wait for server to start

### Step 5: Setup Email Preferences (5 minutes)
- [ ] Go to Supabase SQL Editor
- [ ] Run migration: `supabase/migrations/20260206_email_preferences.sql`
- [ ] Verify table created: `SELECT * FROM email_preferences LIMIT 1;`
- [ ] Test preferences page: `http://localhost:3000/settings/email-preferences`

## ✅ Testing (Optional but Recommended)

### Test 1: Preview Email Templates
- [ ] Open browser: `http://localhost:3000/api/email/preview?template=welcome`
- [ ] Try other templates:
  - [ ] `?template=waiting-approval`
  - [ ] `?template=approval`
  - [ ] `?template=document-ready&docType=resume`

### Test 2: Register New User
- [ ] Sign out if logged in
- [ ] Register a new test account
- [ ] Check your email inbox
- [ ] Verify you received:
  - [ ] Welcome email
  - [ ] Waiting for approval email

### Test 3: Check Resend Dashboard
- [ ] Go to [resend.com/emails](https://resend.com/emails)
- [ ] Verify emails show as "Delivered"
- [ ] Check email details and logs

## 📚 Documentation Quick Links

- **Quick Setup:** [docs/EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md)
- **Full Docs:** [docs/EMAIL_SYSTEM.md](./docs/EMAIL_SYSTEM.md)
- **Flow Diagrams:** [docs/EMAIL_FLOWS.md](./docs/EMAIL_FLOWS.md)
- **User Preferences:** [docs/EMAIL_PREFERENCES.md](./docs/EMAIL_PREFERENCES.md)
- **Preferences Setup:** [docs/EMAIL_PREFERENCES_SETUP.md](./docs/EMAIL_PREFERENCES_SETUP.md)
- **Implementation Summary:** [docs/EMAIL_IMPLEMENTATION_SUMMARY.md](./docs/EMAIL_IMPLEMENTATION_SUMMARY.md)

## 🎯 What Emails Are Active?

- ✅ **Welcome** - When user signs up
- ✅ **Waiting for Approval** - After registration
- ✅ **Approval Confirmation** - When admin approves
- ✅ **Resume Ready** - When resume is generated
- ✅ **Cover Letter Ready** - When cover letter is generated

## 🔔 Email Preferences

Users can control which emails they receive:
- ✅ Account & Security emails
- ✅ Document notifications
- ✅ Job application emails
- ✅ Weekly digests
- ✅ Marketing & tips

**Settings page:** `/settings/email-preferences`

## 🚀 Production Setup (When Ready)

### Domain Verification
- [ ] Go to [resend.com/domains](https://resend.com/domains)
- [ ] Click "Add Domain"
- [ ] Enter your domain: `yourdomain.com`
- [ ] Add DNS records to your domain provider:
  - [ ] SPF record
  - [ ] DKIM records
  - [ ] DMARC record (optional)
- [ ] Wait for verification (5-30 minutes)

### Update Production Variables
- [ ] Update `EMAIL_FROM=Your App <noreply@yourdomain.com>`
- [ ] Update `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- [ ] Set `EMAIL_REPLY_TO=support@yourdomain.com`
- [ ] Set `SUPPORT_EMAIL=support@yourdomain.com`

## 🐛 Troubleshooting

### Email Not Received?
- [ ] Check spam/junk folder
- [ ] Verify API key in `.env.local`
- [ ] Check Resend dashboard for errors
- [ ] Check server console logs
- [ ] Test with `delivered@resend.dev` (Resend test email)

### Template Not Rendering?
- [ ] Check browser console for errors
- [ ] Verify all environment variables are set
- [ ] Restart dev server

### Need Help?
1. Check [docs/EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md)
2. Visit [Resend Documentation](https://resend.com/docs)
3. Check [Resend Status](https://status.resend.com)

## 📊 Rate Limits (Free Tier)

- **3,000 emails per month** ✅
- **100 emails per day** ✅
- Perfect for development and small apps!

---

**That's it!** You're ready to send beautiful emails! 🎉

Need more details? Check out [docs/EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md)
