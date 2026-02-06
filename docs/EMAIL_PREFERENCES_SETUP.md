# Email Preferences Setup Guide

Quick guide to setting up the email preferences system in your application.

## Prerequisites

- Email system already set up (see [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md))
- Supabase database access
- Running Next.js application

## Setup Steps (10 minutes)

### Step 1: Run Database Migration (2 minutes)

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Open the migration file: `supabase/migrations/20260206_email_preferences.sql`
4. Copy and paste the entire content
5. Click "Run" to execute the migration

**Verify:**
```sql
-- Check table was created
SELECT * FROM email_preferences LIMIT 5;

-- Check trigger works
SELECT * FROM users LIMIT 1;
-- Register should auto-create preferences
```

### Step 2: Verify API Endpoints (2 minutes)

Test that the preference endpoints work:

```bash
# 1. Start your dev server
npm run dev

# 2. Sign in to your app
# Go to: http://localhost:3000

# 3. Test GET endpoint
# Open browser console and run:
fetch('/api/email-preferences')
  .then(r => r.json())
  .then(console.log)

# 4. Test PATCH endpoint
fetch('/api/email-preferences', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ marketing_emails: false })
}).then(r => r.json()).then(console.log)
```

### Step 3: Access Settings Page (1 minute)

1. Sign in to your app
2. Click "Settings" in the menu
3. Click "Email Preferences"
4. Or go directly to: `http://localhost:3000/settings/email-preferences`

You should see:
- ✅ Five email categories with toggle switches
- ✅ Descriptions and examples for each
- ✅ Real-time updates when you toggle

### Step 4: Test Preference Checking (5 minutes)

Test that emails respect preferences:

```bash
# 1. Disable document emails in settings UI

# 2. Generate a resume
# Go to: http://localhost:3000/resume-builder

# 3. Check server logs
# You should see:
# "Document ready email skipped due to user preferences: user@example.com"

# 4. Re-enable document emails

# 5. Generate another resume
# You should receive the email this time
```

## Verification Checklist

- [ ] Database migration completed successfully
- [ ] `email_preferences` table exists
- [ ] New users automatically get default preferences
- [ ] GET `/api/email-preferences` returns preferences
- [ ] PATCH `/api/email-preferences` updates preferences
- [ ] Settings page accessible at `/settings/email-preferences`
- [ ] Toggle switches work and update in real-time
- [ ] Emails are skipped when preferences are disabled
- [ ] Emails are sent when preferences are enabled

## Common Issues

### Issue: Preferences not auto-created for existing users

**Solution:** Run this SQL to backfill:
```sql
INSERT INTO email_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM email_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

### Issue: Settings page shows "Failed to load preferences"

**Checks:**
1. User is signed in
2. User exists in `users` table
3. Check browser console for errors
4. Check server logs for API errors

### Issue: Emails still sending despite preferences disabled

**Checks:**
1. Verify preference updated in database:
   ```sql
   SELECT * FROM email_preferences WHERE user_id = 'xxx';
   ```
2. Check server logs for "skipped due to user preferences"
3. Ensure email function not using `skipPreferenceCheck: true`

### Issue: RLS policy errors

**Solution:** Verify RLS policies exist:
```sql
-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'email_preferences';

-- Should have 3 policies:
-- - Users can read their own email preferences
-- - Users can update their own email preferences  
-- - Users can insert their own email preferences
```

## Email Category Mapping

When adding new emails, map them to the correct category:

| Email Type | Category | Field Name |
|-----------|----------|------------|
| Account, approval, security | `account` | `account_emails` |
| Resume, cover letter ready | `document` | `document_emails` |
| Job applications | `application` | `application_emails` |
| Weekly summaries | `digest` | `digest_emails` |
| Marketing, tips, updates | `marketing` | `marketing_emails` |

## Adding a New Email Category

If you need to add a new category:

1. **Update database schema:**
```sql
ALTER TABLE email_preferences 
ADD COLUMN new_category_emails BOOLEAN NOT NULL DEFAULT true;
```

2. **Update TypeScript types:**
```typescript
// lib/types/email-preferences.ts
export type EmailPreferences = {
  // ... existing fields
  new_category_emails: boolean;
};

export const EMAIL_CATEGORY_INFO = {
  // ... existing categories
  new_category: {
    label: 'New Category',
    description: 'Description of emails',
    critical: false,
    examples: ['Example 1', 'Example 2'],
  },
};
```

3. **Update API to handle new field** (already supports dynamic fields)

4. **UI will automatically show new category** (reads from EMAIL_CATEGORY_INFO)

## Testing Checklist

Use this checklist to test the system:

**Database Tests:**
- [ ] Migration runs without errors
- [ ] Preferences auto-created for new users
- [ ] Can query preferences table
- [ ] RLS policies work correctly

**API Tests:**
- [ ] GET returns current user preferences
- [ ] PATCH updates specific preferences
- [ ] PATCH validates user permissions
- [ ] Returns 401 for unauthenticated requests

**UI Tests:**
- [ ] Settings page loads without errors
- [ ] All 5 categories displayed
- [ ] Toggle switches work
- [ ] Changes saved in real-time
- [ ] Success message shown on update
- [ ] Error message shown on failure

**Email Tests:**
- [ ] Emails sent when preference enabled
- [ ] Emails skipped when preference disabled
- [ ] Critical emails always sent (password reset)
- [ ] Preference check errors don't block emails
- [ ] Logs show skipped emails

## Next Steps

After setup is complete:

1. **Add footer link** to email preferences in your app layout
2. **Test with real users** to gather feedback
3. **Monitor opt-out rates** in your analytics
4. **Add email preferences link** to all email templates (future)
5. **Consider additional categories** as you add new email types

## Documentation References

- **Complete Documentation:** [EMAIL_PREFERENCES.md](./EMAIL_PREFERENCES.md)
- **Email System Docs:** [EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md)
- **Email Flows:** [EMAIL_FLOWS.md](./EMAIL_FLOWS.md)

## Support

If you encounter issues:

1. Check [EMAIL_PREFERENCES.md](./EMAIL_PREFERENCES.md) troubleshooting section
2. Review server logs for errors
3. Check Supabase logs for database issues
4. Verify RLS policies are correct

---

**Setup Time:** ~10 minutes  
**Status:** ✅ Production Ready  
**Last Updated:** February 2026
