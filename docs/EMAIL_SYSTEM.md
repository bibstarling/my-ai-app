# Email System Documentation

## Overview

This application uses **Resend** as the email service provider with **React Email** for beautiful, type-safe email templates.

## Features

- 🎉 **Welcome Emails** - Sent when a user first signs up
- ⏳ **Waiting for Approval** - Notifies users their account needs admin approval
- ✅ **Approval Confirmation** - Sent when admin approves a user
- 🔐 **Password Reset** - For forgotten password flows
- 📝 **Job Application** - Confirmation when user prepares a job application
- ✨ **Document Ready** - Notifies when resume/cover letter is generated

## Why Resend?

We chose Resend because it offers:

- **3,000 emails/month free** (best free tier available)
- **Modern API** designed specifically for Next.js
- **React Email integration** for beautiful templates
- **Built-in analytics** and email tracking
- **Domain verification** for better deliverability
- **Simple setup** with excellent developer experience

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Navigate to [API Keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `re_`)

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here

# Email Settings
EMAIL_FROM=Your App Name <onboarding@resend.dev>
EMAIL_REPLY_TO=support@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production, use your verified domain:
# EMAIL_FROM=Your App Name <noreply@yourdomain.com>
```

### 4. Domain Verification (Production)

For production, you should verify your own domain:

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to your domain provider
5. Wait for verification (usually takes a few minutes)
6. Update `EMAIL_FROM` to use your domain

## Email Templates

All email templates are located in `lib/email/templates/`:

### WelcomeEmail.tsx
Sent when a user first signs up. Contains:
- Greeting with user's name
- Confirmation of account creation
- Call-to-action button to get started

### WaitingApprovalEmail.tsx
Sent after registration. Contains:
- Account status information
- Expected approval timeline (24-48 hours)
- Next steps explanation

### ApprovalConfirmationEmail.tsx
Sent when admin approves a user. Contains:
- Approval confirmation
- List of available features
- Link to dashboard

### PasswordResetEmail.tsx
Sent for password reset requests. Contains:
- Reset password button with secure link
- Security warning if user didn't request reset
- Link expiration notice (1 hour)

### JobApplicationEmail.tsx
Sent when user prepares a job application. Contains:
- Job title and company name
- Match percentage (if available)
- List of prepared documents
- Next steps guidance

### DocumentReadyEmail.tsx
Sent when resume or cover letter is generated. Contains:
- Document type and title
- Link to view/edit document
- Action suggestions (review, download, adapt)
- Pro tips for document usage

## Using the Email Functions

### Import the functions

```typescript
import {
  sendWelcomeEmail,
  sendWaitingApprovalEmail,
  sendApprovalConfirmationEmail,
  sendPasswordResetEmail,
  sendJobApplicationEmail,
  sendDocumentReadyEmail,
} from '@/lib/email';
```

### Send a welcome email

```typescript
await sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John Doe',
});
```

### Send waiting for approval email

```typescript
await sendWaitingApprovalEmail({
  to: 'user@example.com',
  userName: 'John Doe',
});
```

### Send approval confirmation

```typescript
await sendApprovalConfirmationEmail({
  to: 'user@example.com',
  userName: 'John Doe',
});
```

### Send password reset email

```typescript
await sendPasswordResetEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  resetUrl: 'https://yourapp.com/reset-password?token=xyz',
});
```

### Send job application email

```typescript
await sendJobApplicationEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  jobTitle: 'Senior Software Engineer',
  companyName: 'TechCorp',
  matchPercentage: 85,
  jobDetailsUrl: 'https://yourapp.com/jobs/123',
});
```

### Send document ready email

```typescript
await sendDocumentReadyEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  documentType: 'resume', // or 'cover-letter'
  documentTitle: 'Software Engineer Resume',
  documentUrl: 'https://yourapp.com/resume/123',
});
```

## Current Integration Points

### 1. User Registration (`/api/users/register`)
- Sends **Welcome Email**
- Sends **Waiting for Approval Email**

### 2. User Approval (`/api/users/approve`)
- Sends **Approval Confirmation Email**

### 3. Admin Dashboard (`/admin`)
- Triggers approval email when admin clicks "Approve"

## Recommended Future Integrations

### Resume Generation
Add to `/api/resume/generate/route.ts`:

```typescript
import { sendDocumentReadyEmail } from '@/lib/email';

// After resume is created
await sendDocumentReadyEmail({
  to: userEmail,
  userName: userName,
  documentType: 'resume',
  documentTitle: resumeTitle,
  documentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/resume/${resumeId}`,
});
```

### Cover Letter Generation
Add to `/api/cover-letter/generate/route.ts`:

```typescript
import { sendDocumentReadyEmail } from '@/lib/email';

// After cover letter is created
await sendDocumentReadyEmail({
  to: userEmail,
  userName: userName,
  documentType: 'cover-letter',
  documentTitle: `Cover Letter for ${jobTitle}`,
  documentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cover-letters/${letterId}`,
});
```

### Job Application Tracking
Add to your job application tracking logic:

```typescript
import { sendJobApplicationEmail } from '@/lib/email';

// When user tracks a job application
await sendJobApplicationEmail({
  to: userEmail,
  userName: userName,
  jobTitle: job.title,
  companyName: job.company,
  matchPercentage: job.matchPercentage,
  jobDetailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/work/${jobId}`,
});
```

## Testing Emails

### Development Testing

During development, Resend provides a test email address:

```typescript
// Test emails will be visible in your Resend dashboard
await sendWelcomeEmail({
  to: 'delivered@resend.dev', // This is a test email
  userName: 'Test User',
});
```

### Production Testing

Before going live:

1. Test with your own email address
2. Check spam folder
3. Verify all links work correctly
4. Test on different email clients (Gmail, Outlook, etc.)

## Email Deliverability Best Practices

1. **Verify your domain** in production
2. **Use a dedicated sending domain** (e.g., `mail.yourdomain.com`)
3. **Add SPF, DKIM, and DMARC records** (Resend provides these)
4. **Avoid spam trigger words** in subject lines
5. **Include plain text versions** (React Email handles this)
6. **Monitor bounce rates** in Resend dashboard

## Monitoring and Analytics

Resend provides built-in analytics:

1. Go to [Resend Dashboard](https://resend.com/emails)
2. View email delivery status
3. Track open rates (if enabled)
4. Monitor bounce and complaint rates

## Error Handling

All email functions return a result object:

```typescript
const result = await sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John',
});

if (result.success) {
  console.log('Email sent:', result.data?.id);
} else {
  console.error('Email failed:', result.error);
}
```

Emails are sent asynchronously and failures won't break the user flow. Always log errors for monitoring.

## Troubleshooting

### Email not received

1. Check Resend dashboard for delivery status
2. Verify email address is correct
3. Check spam/junk folder
4. Ensure API key is valid
5. Check rate limits (3,000/month on free tier)

### Template rendering errors

1. Check console for React Email errors
2. Ensure all required props are passed
3. Verify environment variables are set

### Domain verification issues

1. Check DNS records are correct
2. Wait 24-48 hours for DNS propagation
3. Use Resend's DNS checker tool

## Rate Limits

**Free Tier:**
- 3,000 emails per month
- 100 emails per day

**Paid Tiers:**
- Pro: 50,000 emails/month ($20)
- Business: Custom pricing

Monitor your usage in the Resend dashboard.

## Support

- **Resend Documentation:** [resend.com/docs](https://resend.com/docs)
- **React Email:** [react.email](https://react.email)
- **Support Email:** support@resend.com

## Additional Features to Consider

1. **Email Verification** - Verify email addresses on signup
2. **Weekly Digest** - Job recommendations email
3. **Application Reminders** - Follow-up reminders for applications
4. **Interview Prep** - Tips and preparation emails
5. **Success Stories** - Motivational emails
6. **Newsletter** - Job market insights and tips
