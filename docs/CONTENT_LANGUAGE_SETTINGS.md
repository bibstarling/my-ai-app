# Content Language Settings

## Overview

Users can now set their default language for AI-generated content and change it per document when generating resumes and cover letters.

## What Was Implemented

### 1. User Settings Page

**Location:** `/assistant/settings`

A new settings page where users can:
- Select their default content generation language (English or Portuguese)
- Save their preference
- See real-time confirmation when settings are saved

### 2. Database Schema

**Migration:** `20260207_add_user_preferences.sql`

Added to users table:
- `content_language` column (TEXT, default: 'en')
- Constraint: Only accepts 'en' or 'pt'
- Indexed for faster queries

### 3. API Endpoint

**Route:** `/api/users/settings`

- **GET**: Fetches user's current settings
- **POST**: Saves user's settings
- Auto-creates user record if doesn't exist
- Returns default 'en' for new users

### 4. Generation Modals

Updated both modals to include language selection:

#### Resume Generation Modal
- Fetches user's default language
- Pre-selects the default
- Allows changing for this specific document
- Sends `content_language` to generation API

#### Cover Letter Generation Modal
- Same functionality as resume modal
- Pre-selects user's default
- Changeable per document
- Sends language preference to API

### 5. Menu Integration

Added "Settings" to the main navigation menu:
- Icon: Settings gear
- Accessible from all app pages
- Fully translated

## User Flow

### Setting Default Language

1. User clicks "Settings" in menu
2. Sees current default language (or English if new user)
3. Selects preferred language
4. Clicks "Save Changes"
5. Sees success confirmation

### Generating Documents

1. User clicks "Generate Resume" or "Generate Cover Letter"
2. Modal opens with default language pre-selected
3. User can:
   - Keep the default language
   - Change it for this specific document
4. User selects a job
5. Clicks "Generate"
6. Document is generated in selected language

## Technical Details

### Database Structure

```sql
ALTER TABLE users 
ADD COLUMN content_language TEXT DEFAULT 'en' 
CHECK (content_language IN ('en', 'pt'));
```

### API Request Format

**Save Settings:**
```json
POST /api/users/settings
{
  "content_language": "pt"
}
```

**Get Settings:**
```json
GET /api/users/settings
Response: {
  "settings": {
    "content_language": "pt"
  }
}
```

### Generation APIs

Both resume and cover letter generation now accept:
```json
{
  "job_id": "...",
  "content_language": "pt"  // or "en"
}
```

## Translations

All UI elements are fully translated:

### English Keys:
- `settings.title`: "Settings"
- `settings.contentGeneration.title`: "Content Generation"
- `settings.contentGeneration.defaultLanguage`: "Default Language"
- `settings.saveChanges`: "Save Changes"
- `settings.saveSuccess`: "Settings saved successfully"
- etc.

### Portuguese Keys:
- `settings.title`: "Configurações"
- `settings.contentGeneration.title`: "Geração de Conteúdo"
- `settings.contentGeneration.defaultLanguage`: "Idioma Padrão"
- `settings.saveChanges`: "Salvar Alterações"
- `settings.saveSuccess`: "Configurações salvas com sucesso"
- etc.

## Files Changed/Created

### New Files:
1. `app/assistant/settings/page.tsx` - Settings page component
2. `app/api/users/settings/route.ts` - API endpoint
3. `supabase/migrations/20260207_add_user_preferences.sql` - Database migration
4. `docs/CONTENT_LANGUAGE_SETTINGS.md` - This documentation

### Modified Files:
1. `app/components/AppMenu.tsx` - Added Settings menu item
2. `app/resume-builder/page.tsx` - Added language selector to generation modal
3. `app/cover-letters/page.tsx` - Added language selector to generation modal
4. `messages/en.json` - Added English translations
5. `messages/pt.json` - Added Portuguese translations
6. `supabase/all-migrations-combined.sql` - Added migration to combined file

## Features

### ✅ Default Language Setting
- User can set preferred language once
- Persists across sessions
- Applies to all future generations

### ✅ Per-Document Override
- Each generation modal shows language selector
- Default is pre-selected
- User can change for specific document
- Doesn't affect saved preference

### ✅ Fully Translated
- Settings page in both languages
- Modal labels in both languages
- All UI elements localized

### ✅ Smart Defaults
- New users default to English
- Setting is optional
- Works without user interaction

## Usage Examples

### Example 1: User Sets Portuguese as Default

1. User opens Settings
2. Selects "Português"
3. Clicks "Salvar Alterações"
4. Later, opens "Generate Resume"
5. Portuguese is already selected
6. Generated resume is in Portuguese

### Example 2: Portuguese User Generates English Resume

1. User has Portuguese set as default
2. Opens "Generate Resume"
3. Portuguese is pre-selected
4. User clicks "English" in modal
5. Generates resume in English
6. Default setting remains Portuguese

### Example 3: New User

1. New user logs in
2. No setting configured
3. Opens "Generate Resume"
4. English is selected (default)
5. Can change to Portuguese if needed
6. Can save preference in Settings later

## Migration Instructions

### For Existing Database:

Run the migration:
```bash
# Option 1: Via Supabase Dashboard
# Copy content from supabase/migrations/20260207_add_user_preferences.sql
# Paste into SQL Editor and run

# Option 2: Via all-migrations-combined.sql
# The migration is included at the end
```

### For New Database:

The migration is included in `all-migrations-combined.sql` and will run automatically.

## Testing Checklist

- [ ] Settings page loads correctly
- [ ] Can save language preference
- [ ] Saved preference appears on reload
- [ ] Resume modal shows correct default
- [ ] Cover letter modal shows correct default
- [ ] Can override default in modal
- [ ] Override doesn't change saved preference
- [ ] English and Portuguese both work
- [ ] All text is translated
- [ ] Settings menu item appears
- [ ] Settings menu item is translated

## Future Enhancements

Potential improvements:
- [ ] Add more languages (Spanish, French, etc.)
- [ ] Per-document-type preferences (resume in English, cover letter in Portuguese)
- [ ] Language detection from job posting
- [ ] Auto-translate existing documents
- [ ] Bulk language change for all documents

## Troubleshooting

### Settings Not Saving
**Problem:** Changes don't persist

**Solutions:**
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check database permissions
4. Ensure migration ran successfully

### Wrong Language in Modal
**Problem:** Modal doesn't show saved preference

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check that settings API returns correct value
4. Verify modal fetches settings on mount

### Migration Errors
**Problem:** Database migration fails

**Solutions:**
1. Check if column already exists
2. Verify table "users" exists
3. Ensure you have ALTER TABLE permission
4. Run migrations in order

## Support

For issues or questions:
1. Check this documentation
2. Verify translations are complete
3. Test in both languages
4. Check browser console for errors

---

**Status:** ✅ Fully Implemented
**Languages Supported:** English, Portuguese
**Total Translation Keys Added:** 14 keys
**Migration:** 20260207_add_user_preferences.sql
