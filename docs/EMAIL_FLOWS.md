# Email Flows Overview

This document provides a visual overview of all email flows in the application.

## 📧 Email Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY & EMAIL FLOWS                        │
└─────────────────────────────────────────────────────────────────────────────┘

1. SIGN UP
   ┌─────────────┐
   │  User Signs │
   │     Up      │
   └──────┬──────┘
          │
          ├──────> 📧 Welcome Email
          │        "Welcome to My AI App!"
          │        - Greeting
          │        - Account confirmation
          │        - Get started CTA
          │
          └──────> 📧 Waiting for Approval Email
                   "Account Pending Approval"
                   - Status: Pending
                   - Timeline: 24-48 hours
                   - What happens next

2. ADMIN APPROVAL
   ┌─────────────┐
   │ Admin Clicks│
   │  "Approve"  │
   └──────┬──────┘
          │
          └──────> 📧 Approval Confirmation Email
                   "Account Approved!"
                   - Full access granted
                   - Feature list
                   - Dashboard link

3. PASSWORD RESET (Future)
   ┌─────────────┐
   │User Requests│
   │Password Reset│
   └──────┬──────┘
          │
          └──────> 📧 Password Reset Email
                   "Reset Your Password"
                   - Reset link (1 hour expiry)
                   - Security warning
                   - Ignore if not requested

4. RESUME GENERATION
   ┌─────────────┐
   │User Generates│
   │   Resume    │
   └──────┬──────┘
          │
          └──────> 📧 Document Ready Email
                   "Your Resume is Ready!"
                   - Resume title
                   - View/Edit link
                   - Next steps
                   - Pro tips

5. COVER LETTER GENERATION
   ┌─────────────┐
   │User Generates│
   │Cover Letter │
   └──────┬──────┘
          │
          └──────> 📧 Document Ready Email
                   "Your Cover Letter is Ready!"
                   - Cover letter details
                   - View/Edit link
                   - Next steps
                   - Pro tips

6. JOB APPLICATION (Ready to Use)
   ┌─────────────┐
   │User Tracks  │
   │Job Application│
   └──────┬──────┘
          │
          └──────> 📧 Job Application Email
                   "Application Submitted!"
                   - Job title & company
                   - Match percentage
                   - Documents prepared
                   - Next steps
```

## 📊 Email Statistics

| Email Type | When Sent | Status | Template |
|------------|-----------|--------|----------|
| Welcome | User signs up | ✅ Active | `WelcomeEmail.tsx` |
| Waiting for Approval | User signs up | ✅ Active | `WaitingApprovalEmail.tsx` |
| Approval Confirmation | Admin approves | ✅ Active | `ApprovalConfirmationEmail.tsx` |
| Password Reset | User requests reset | 📝 Template Ready | `PasswordResetEmail.tsx` |
| Resume Ready | Resume generated | ✅ Active | `DocumentReadyEmail.tsx` |
| Cover Letter Ready | Cover letter generated | ✅ Active | `DocumentReadyEmail.tsx` |
| Job Application | Job tracked | 📝 Ready to Integrate | `JobApplicationEmail.tsx` |

## 🔄 Email Flow Integration Points

### Currently Integrated

1. **User Registration** (`/api/users/register`)
   ```typescript
   POST /api/users/register
   ├── Create user in database
   ├── Send Welcome Email ✅
   └── Send Waiting Approval Email ✅
   ```

2. **User Approval** (`/api/users/approve`)
   ```typescript
   POST /api/users/approve
   ├── Update user.approved = true
   └── Send Approval Confirmation Email ✅
   ```

3. **Resume Generation** (`/api/resume/generate`)
   ```typescript
   POST /api/resume/generate
   ├── Generate AI resume
   ├── Save to database
   └── Send Document Ready Email ✅
   ```

4. **Cover Letter Generation** (`/api/cover-letter/generate`)
   ```typescript
   POST /api/cover-letter/generate
   ├── Generate AI cover letter
   ├── Save to database
   └── Send Document Ready Email ✅
   ```

### Ready to Integrate

5. **Job Application Tracking** (Recommended)
   ```typescript
   // Add to your job tracking logic
   import { sendJobApplicationEmail } from '@/lib/email';
   
   await sendJobApplicationEmail({
     to: userEmail,
     userName: userName,
     jobTitle: job.title,
     companyName: job.company,
     matchPercentage: job.matchPercentage,
     jobDetailsUrl: `${appUrl}/work/${jobId}`,
   });
   ```

6. **Password Reset** (When implementing forgot password)
   ```typescript
   // Add to password reset flow
   import { sendPasswordResetEmail } from '@/lib/email';
   
   await sendPasswordResetEmail({
     to: userEmail,
     userName: userName,
     resetUrl: resetLink,
   });
   ```

## 🎨 Email Templates

All templates follow a consistent design:

### Design System
- **Primary Color:** `#5469d4` (Blue)
- **Success Color:** `#28a745` (Green)
- **Warning Color:** `#ffc107` (Amber)
- **Danger Color:** `#dc3545` (Red)
- **Background:** `#f6f9fc` (Light gray)
- **Font:** System font stack (Apple, Segoe UI, Roboto)

### Template Structure
```
┌────────────────────────────────────┐
│          [EMAIL HEADER]            │
│    Heading with Emoji 🎉           │
├────────────────────────────────────┤
│                                    │
│    Hi [User Name],                 │
│                                    │
│    [Main Message Content]          │
│                                    │
│    ┌──────────────────┐            │
│    │  [Call-to-Action] │            │
│    └──────────────────┘            │
│                                    │
│    [Additional Information]        │
│                                    │
├────────────────────────────────────┤
│          [FOOTER]                  │
│    Small text, disclaimers         │
└────────────────────────────────────┘
```

## 🧪 Testing Emails

### Preview in Browser

Visit these URLs to preview email templates:

- Welcome: `http://localhost:3000/api/email/preview?template=welcome`
- Waiting Approval: `http://localhost:3000/api/email/preview?template=waiting-approval`
- Approval: `http://localhost:3000/api/email/preview?template=approval`
- Password Reset: `http://localhost:3000/api/email/preview?template=password-reset`
- Job Application: `http://localhost:3000/api/email/preview?template=job-application`
- Resume Ready: `http://localhost:3000/api/email/preview?template=document-ready&docType=resume`
- Cover Letter Ready: `http://localhost:3000/api/email/preview?template=document-ready&docType=cover-letter`

### Send Test Email (Development Only)

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","name":"Test User"}'
```

Or use Resend's test email address:
```typescript
await sendWelcomeEmail({
  to: 'delivered@resend.dev',
  userName: 'Test User',
});
```

## 📈 Future Email Ideas

### Engagement Emails
1. **Weekly Job Digest** - Top matching jobs from the past week
2. **Application Reminders** - Follow up on pending applications
3. **Profile Completion** - Encourage users to complete their profile
4. **Success Stories** - Share inspirational job search success stories

### Transactional Emails
5. **Interview Scheduled** - Confirmation when user logs interview
6. **Application Status Update** - When application status changes
7. **New Message** - When employer sends message
8. **Document Expiring** - Reminder to update resume/cover letter

### Marketing Emails
9. **Feature Announcements** - New features and improvements
10. **Tips & Tricks** - Job search advice and best practices
11. **Monthly Newsletter** - Job market insights
12. **Referral Program** - Invite friends rewards

### Automation Emails
13. **Onboarding Series** - 5-day email course for new users
14. **Re-engagement** - Win back inactive users
15. **Survey Requests** - Gather user feedback
16. **Birthday/Anniversary** - Celebrate with users

## 🔐 Security & Privacy

- ✅ All emails require user authentication
- ✅ Email addresses are never shared
- ✅ Unsubscribe link in marketing emails (future)
- ✅ Email preferences management (future)
- ✅ GDPR compliant
- ✅ SSL/TLS encryption in transit

## 📊 Email Performance

### Key Metrics to Monitor

1. **Delivery Rate** - % of emails successfully delivered
2. **Open Rate** - % of delivered emails opened (if tracking enabled)
3. **Click Rate** - % of users clicking links in emails
4. **Bounce Rate** - % of emails that bounced
5. **Complaint Rate** - % marked as spam

### Resend Dashboard

Monitor all metrics in your [Resend Dashboard](https://resend.com/emails):
- View sent emails
- Check delivery status
- Track opens and clicks
- Monitor bounce rates
- View error logs

## 🚀 Best Practices

### Do's ✅
- ✅ Personalize with user's name
- ✅ Use clear, actionable subject lines
- ✅ Include unsubscribe link (marketing emails)
- ✅ Mobile-responsive design
- ✅ Test before sending
- ✅ Monitor deliverability

### Don'ts ❌
- ❌ Send to unverified email addresses
- ❌ Use misleading subject lines
- ❌ Send too frequently
- ❌ Use all caps or excessive punctuation!!!
- ❌ Include large attachments
- ❌ Ignore bounce/complaint rates

## 📚 Resources

- [Email System Documentation](./EMAIL_SYSTEM.md)
- [Setup Guide](./EMAIL_SETUP_GUIDE.md)
- [Resend Documentation](https://resend.com/docs)
- [React Email](https://react.email)
- [Email Best Practices](https://resend.com/docs/best-practices)

---

**Last Updated:** February 2026  
**Status:** ✅ Production Ready
