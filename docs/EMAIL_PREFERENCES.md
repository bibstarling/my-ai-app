# Email Preferences System

## Overview

The email preferences system allows users to control which categories of emails they receive. This improves user experience and ensures compliance with email marketing regulations (CAN-SPAM, GDPR).

## Email Categories

### 1. Account & Security Emails 🔐
**Field:** `account_emails`  
**Default:** `true` (enabled)  
**Critical:** Yes (important emails that shouldn't be fully disabled)

**Includes:**
- Welcome emails when user signs up
- Account approval notifications
- Security alerts
- Password reset emails
- Account status changes

**Note:** These emails contain critical account information. While users can disable them, password resets always send regardless of preference for security reasons.

### 2. Document Notifications 📄
**Field:** `document_emails`  
**Default:** `true` (enabled)  
**Critical:** No

**Includes:**
- Resume generation complete
- Cover letter ready
- Document updates
- Export notifications

### 3. Job Application Emails 💼
**Field:** `application_emails`  
**Default:** `true` (enabled)  
**Critical:** No

**Includes:**
- Job application tracked
- Application status updates
- Interview reminders
- Application follow-up suggestions

### 4. Weekly Digests 📊
**Field:** `digest_emails`  
**Default:** `true` (enabled)  
**Critical:** No

**Includes:**
- Weekly activity summaries
- Job match recommendations
- Progress reports
- Monthly insights

### 5. Marketing & Product Updates 📢
**Field:** `marketing_emails`  
**Default:** `true` (enabled)  
**Critical:** No

**Includes:**
- New feature announcements
- Job search tips and tricks
- Product updates
- Success stories
- Newsletter

## Database Schema

### Table: `email_preferences`

```sql
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email categories
  account_emails BOOLEAN NOT NULL DEFAULT true,
  document_emails BOOLEAN NOT NULL DEFAULT true,
  application_emails BOOLEAN NOT NULL DEFAULT true,
  digest_emails BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

### Automatic Creation

Email preferences are automatically created when a new user registers via a database trigger:

```sql
CREATE TRIGGER create_default_email_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();
```

## API Endpoints

### GET /api/email-preferences

Get the current user's email preferences.

**Authentication:** Required (Clerk)

**Response:**
```json
{
  "success": true,
  "preferences": {
    "id": "uuid",
    "user_id": "uuid",
    "account_emails": true,
    "document_emails": true,
    "application_emails": false,
    "digest_emails": true,
    "marketing_emails": false,
    "created_at": "2024-02-06T...",
    "updated_at": "2024-02-06T..."
  }
}
```

### PATCH /api/email-preferences

Update the current user's email preferences.

**Authentication:** Required (Clerk)

**Request Body:**
```json
{
  "document_emails": false,
  "marketing_emails": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email preferences updated successfully",
  "preferences": { ... }
}
```

## Using Email Preferences in Code

### Check Before Sending

All email sending functions now check user preferences automatically:

```typescript
import { sendDocumentReadyEmail } from '@/lib/email';

// This will check user preferences before sending
await sendDocumentReadyEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  documentType: 'resume',
  documentTitle: 'My Resume',
  documentUrl: 'https://...',
});
```

### Override Preference Check

For critical emails that must be sent regardless of preferences:

```typescript
// Skip preference check for critical security email
await sendPasswordResetEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  resetUrl: 'https://...',
  skipPreferenceCheck: true, // Always send
});
```

### Manual Preference Check

Check preferences manually without sending:

```typescript
import { shouldSendEmailByAddress } from '@/lib/email';

// Check if user wants document emails
const shouldSend = await shouldSendEmailByAddress(
  'user@example.com',
  'document'
);

if (shouldSend) {
  // Send the email
  await sendDocumentReadyEmail({ ... });
}
```

### Check by User ID

```typescript
import { shouldSendEmail } from '@/lib/email';

// Check by database user ID
const shouldSend = await shouldSendEmail(userId, 'application');
```

### Check by Clerk ID

```typescript
import { shouldSendEmailByClerkId } from '@/lib/email';

// Check by Clerk ID
const shouldSend = await shouldSendEmailByClerkId(clerkId, 'marketing');
```

## Email Function Mappings

Each email function maps to a specific category:

| Email Function | Category | Can Skip Check |
|---------------|----------|----------------|
| `sendWelcomeEmail` | `account` | Yes |
| `sendWaitingApprovalEmail` | `account` | Yes |
| `sendApprovalConfirmationEmail` | `account` | Yes |
| `sendPasswordResetEmail` | `account` | Yes (default) |
| `sendDocumentReadyEmail` | `document` | Yes |
| `sendJobApplicationEmail` | `application` | Yes |
| Future digest emails | `digest` | Yes |
| Future marketing emails | `marketing` | Yes |

## User Interface

### Settings Page

Users can manage preferences at: `/settings/email-preferences`

**Features:**
- Toggle switches for each category
- Category descriptions and examples
- Real-time updates (optimistic UI)
- Success/error notifications
- Visual indicators (icons, badges)

### Navigation

Access via:
1. App Menu → Settings → Email Preferences
2. Direct link: `/settings/email-preferences`
3. Footer link (recommended)

## Best Practices

### 1. Respect User Preferences

Always check preferences before sending non-critical emails:

```typescript
// ✅ Good - checks preferences
await sendDocumentReadyEmail({
  to: userEmail,
  // ... other params
});

// ❌ Bad - skips check unnecessarily
await sendDocumentReadyEmail({
  to: userEmail,
  skipPreferenceCheck: true, // Only use for critical emails
});
```

### 2. Critical Email Handling

Only skip preference checks for truly critical emails:

```typescript
// ✅ Good - critical security email
await sendPasswordResetEmail({
  to: userEmail,
  resetUrl: resetLink,
  skipPreferenceCheck: true, // User requested this
});

// ✅ Good - critical account notification
await sendApprovalConfirmationEmail({
  to: userEmail,
  skipPreferenceCheck: true, // Important account change
});

// ❌ Bad - marketing email shouldn't skip check
await sendMarketingEmail({
  to: userEmail,
  skipPreferenceCheck: true, // Never do this
});
```

### 3. Default to Enabled

New preference categories should default to `true`:

```sql
ALTER TABLE email_preferences 
ADD COLUMN new_category_emails BOOLEAN NOT NULL DEFAULT true;
```

### 4. Provide Context

Always explain what each email category includes:

```typescript
export const EMAIL_CATEGORY_INFO = {
  new_category: {
    label: 'Clear Label',
    description: 'Specific description of what emails are included',
    examples: ['Example 1', 'Example 2', 'Example 3'],
  },
};
```

## Error Handling

### Preference Check Failures

If preference check fails, default to sending the email:

```typescript
try {
  const shouldSend = await shouldSendEmailByAddress(email, category);
  if (!shouldSend) {
    return { success: true, skipped: true };
  }
} catch (error) {
  console.error('Preference check failed:', error);
  // Continue with sending - don't block important emails
}
```

### Database Errors

If preferences can't be loaded, the system defaults to sending emails to avoid blocking important communications.

## Logging

All preference-based email skips are logged:

```typescript
console.log('Document ready email skipped due to user preferences:', email);
```

Monitor these logs to:
- Track opt-out rates
- Identify potential issues
- Understand user preferences

## Compliance

### CAN-SPAM Act (US)

- ✅ Users can opt-out of marketing emails
- ✅ Changes are processed immediately
- ✅ Clear identification of email types
- ✅ Unsubscribe mechanism provided

### GDPR (EU)

- ✅ User consent for non-critical emails
- ✅ Easy preference management
- ✅ Clear information about data usage
- ✅ Right to opt-out

## Testing

### Test Preference Creation

```bash
# Register new user
POST /api/users/register

# Check preferences were created
GET /api/email-preferences
```

### Test Preference Updates

```bash
# Update preferences
PATCH /api/email-preferences
{
  "marketing_emails": false
}

# Verify change
GET /api/email-preferences
```

### Test Email Skipping

```typescript
// Set preference to false
await updatePreferences(userId, { document_emails: false });

// Try to send document email
const result = await sendDocumentReadyEmail({
  to: userEmail,
  documentType: 'resume',
  documentUrl: 'https://...',
});

// Should be skipped
expect(result.skipped).toBe(true);
```

## Migration Guide

### Running the Migration

1. Apply the SQL migration:
```bash
# If using Supabase
# Go to SQL Editor and run:
# supabase/migrations/20260206_email_preferences.sql
```

2. Verify table created:
```sql
SELECT * FROM email_preferences LIMIT 1;
```

3. Test with existing users:
```sql
-- Check if preferences auto-created
SELECT u.email, ep.* 
FROM users u
LEFT JOIN email_preferences ep ON ep.user_id = u.id
LIMIT 10;
```

### Backfilling Existing Users

If preferences aren't auto-created for existing users:

```sql
INSERT INTO email_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM email_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

## Future Enhancements

### Planned Features

1. **Email Frequency Control**
   - Daily digest vs. weekly digest
   - Immediate vs. batched notifications

2. **Granular Preferences**
   - Specific job types
   - Salary range notifications only
   - Location-based alerts

3. **Do Not Disturb**
   - Quiet hours
   - Vacation mode
   - Temporary pause

4. **Email Templates**
   - User-selectable email styles
   - Language preferences
   - Format preferences (HTML vs. plain text)

## Support

### Common Issues

**Q: User isn't receiving any emails**
A: Check their email preferences at `/api/email-preferences`

**Q: Preference changes not taking effect**
A: Verify the database update occurred and check server logs

**Q: Critical emails being blocked**
A: Ensure `skipPreferenceCheck: true` for critical emails

### Debugging

```typescript
// Check user preferences
const preferences = await fetch('/api/email-preferences');
console.log(await preferences.json());

// Test email sending
const result = await sendDocumentReadyEmail({
  to: 'test@example.com',
  documentType: 'resume',
  documentUrl: 'https://...',
});
console.log(result); // { success: true, skipped: false/true }
```

## Related Documentation

- [Email System](./EMAIL_SYSTEM.md) - Main email documentation
- [Email Setup Guide](./EMAIL_SETUP_GUIDE.md) - Getting started
- [Email Flows](./EMAIL_FLOWS.md) - Email flow diagrams

---

**Last Updated:** February 2026  
**Status:** ✅ Production Ready
