# Email System Setup Guide

## Quick Start (5 minutes)

### Step 1: Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" (it's free!)
3. Verify your email address

### Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** in the sidebar
3. Click **"Create API Key"**
4. Give it a name (e.g., "My AI App Development")
5. Copy the API key (it starts with `re_`)

### Step 3: Add to Environment Variables

Open your `.env.local` file and add:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_paste_your_api_key_here
EMAIL_FROM=My AI App <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** For development, you can use `onboarding@resend.dev`. For production, you should verify your own domain (see Production Setup below).

### Step 4: Restart Your Development Server

```bash
npm run dev
```

That's it! Your email system is now active. 🎉

## Test Your Setup

### Option 1: Register a New User

1. Sign out if you're logged in
2. Create a new account
3. Check your email inbox for:
   - Welcome email
   - Waiting for approval email

### Option 2: Use Resend's Test Email

In your code or API testing tool:

```typescript
import { sendWelcomeEmail } from '@/lib/email';

await sendWelcomeEmail({
  to: 'delivered@resend.dev', // Test email address
  userName: 'Test User',
});
```

Check your Resend dashboard under "Emails" to see the sent email.

## Production Setup

### Verify Your Domain (Recommended)

For better deliverability and branding:

1. Go to [Domains](https://resend.com/domains) in Resend
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Copy the DNS records provided
5. Add these records to your domain provider:
   - SPF record
   - DKIM records
   - DMARC record (optional but recommended)
6. Wait for verification (usually 5-30 minutes)

### Update Environment Variables

Once your domain is verified:

```bash
# Production .env
RESEND_API_KEY=re_your_production_api_key
EMAIL_FROM=My AI App <noreply@yourdomain.com>
EMAIL_REPLY_TO=support@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Email Flows Currently Active

### 1. User Registration
**When:** User signs up for the first time

**Emails Sent:**
- ✅ Welcome Email - Greets the user and confirms account creation
- ✅ Waiting for Approval - Informs user about approval process

**Code Location:** `/app/api/users/register/route.ts`

### 2. User Approval
**When:** Admin approves a user in the admin dashboard

**Emails Sent:**
- ✅ Approval Confirmation - Notifies user they can now access all features

**Code Location:** `/app/api/users/approve/route.ts`, `/app/admin/page.tsx`

### 3. Resume Generation
**When:** User generates a new resume

**Emails Sent:**
- ✅ Document Ready - Notifies user their resume is ready for review

**Code Location:** `/app/api/resume/generate/route.ts`

### 4. Cover Letter Generation
**When:** User generates a new cover letter

**Emails Sent:**
- ✅ Document Ready - Notifies user their cover letter is ready

**Code Location:** `/app/api/cover-letter/generate/route.ts`

## Adding More Email Flows

### Example: Job Application Tracking

When a user tracks a job application, you can send a confirmation email:

```typescript
// In your job tracking API route
import { sendJobApplicationEmail } from '@/lib/email';
import { currentUser } from '@clerk/nextjs/server';

// After successfully tracking the job
const user = await currentUser();
const userEmail = user?.emailAddresses?.[0]?.emailAddress;

if (userEmail) {
  await sendJobApplicationEmail({
    to: userEmail,
    userName: user?.firstName || user?.username,
    jobTitle: job.title,
    companyName: job.company,
    matchPercentage: job.matchPercentage,
    jobDetailsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/work/${job.id}`,
  });
}
```

### Example: Custom Notification Email

For custom emails, use the generic sender:

```typescript
import { sendCustomEmail } from '@/lib/email';

await sendCustomEmail({
  to: 'user@example.com',
  subject: 'Your weekly job digest',
  html: '<h1>Here are your top job matches this week</h1><p>...</p>',
});
```

## Monitoring

### View Sent Emails

1. Log in to [Resend Dashboard](https://resend.com/emails)
2. View all sent emails with delivery status
3. See open rates (if tracking is enabled)
4. Monitor bounce and complaint rates

### Check Logs

Server logs will show email sending activity:

```bash
# Success
Welcome email sent successfully: <email_id>

# Failure
Failed to send welcome email: <error_message>
```

## Troubleshooting

### Email Not Received

1. **Check Resend Dashboard** - Look for the email in your sent emails
2. **Check Spam Folder** - Emails might be in spam/junk
3. **Verify API Key** - Make sure `RESEND_API_KEY` is set correctly
4. **Check Rate Limits** - Free tier: 100 emails/day, 3,000/month

### Template Errors

1. **Check Console** - Look for React Email rendering errors
2. **Verify Props** - Ensure all required props are passed
3. **Test Locally** - Use Resend's test email: `delivered@resend.dev`

### Domain Verification Issues

1. **DNS Propagation** - Can take up to 48 hours
2. **Check Records** - Use [MXToolbox](https://mxtoolbox.com/) to verify DNS
3. **Resend Dashboard** - Check verification status

## Rate Limits & Costs

### Free Tier
- **3,000 emails per month**
- **100 emails per day**
- Perfect for development and small projects

### Paid Tiers
- **Pro:** $20/month - 50,000 emails
- **Business:** Custom pricing - Unlimited with volume discounts

### Best Practices to Stay Within Limits

1. **Don't send duplicates** - Check if email was already sent
2. **Batch notifications** - Group daily/weekly instead of instant
3. **Use email preferences** - Let users opt out of certain emails
4. **Monitor usage** - Check Resend dashboard regularly

## Security Best Practices

1. **Keep API Key Secret** - Never commit to git
2. **Use Environment Variables** - Always use `.env.local`
3. **Validate Email Addresses** - Check format before sending
4. **Rate Limit Your API** - Prevent abuse
5. **Log Email Activity** - Monitor for suspicious activity

## Support Resources

- **Resend Documentation:** [resend.com/docs](https://resend.com/docs)
- **React Email:** [react.email](https://react.email)
- **Resend Status:** [status.resend.com](https://status.resend.com)
- **Resend Support:** support@resend.com

## User Email Preferences

Users can control which emails they receive! The system includes a preference management page where users can:

- Enable/disable different email categories
- See examples of each email type
- Update preferences in real-time

**Access at:** `/settings/email-preferences`

All email sending functions automatically check user preferences before sending (except critical security emails).

See [EMAIL_PREFERENCES.md](./EMAIL_PREFERENCES.md) for complete documentation.

## Next Steps

1. ✅ Set up Resend account and API key
2. ✅ Test email sending with your account
3. 🔄 Run the email preferences migration
4. 📧 Add job application tracking emails (optional)
5. 📧 Add weekly digest emails (optional)
6. 🚀 Verify your domain for production
7. 📊 Set up monitoring and alerts

## Need Help?

If you encounter any issues:

1. Check the [Full Email System Documentation](./EMAIL_SYSTEM.md)
2. Review Resend's troubleshooting guide
3. Check server logs for error messages
4. Test with Resend's test email address: `delivered@resend.dev`

Happy emailing! 📧✨
