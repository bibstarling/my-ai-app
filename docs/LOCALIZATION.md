# Localization Implementation

## Overview

The platform has been localized to support both English and Portuguese, with a language switcher in the footer.

## What Was Implemented

### 1. Next-intl Integration
- Installed `next-intl` package for internationalization
- Configured i18n with English (en) and Portuguese (pt) locales
- Updated Next.js config to use next-intl plugin

### 2. File Structure Changes
- Created `i18n.ts` configuration file
- Created `messages/` folder with translation files:
  - `messages/en.json` - English translations
  - `messages/pt.json` - Portuguese translations
- Restructured app routes under `app/[locale]/` for locale support
- Updated `middleware.ts` to combine Clerk authentication with i18n routing

### 3. UI Components
- Created `Footer` component with language switcher dropdown
- Updated `AppLayout` to include the footer
- Language switcher shows current language with Globe icon
- Dropdown menu allows switching between English and Portuguese

### 4. Translations
The following sections are fully translated:
- Navigation menu
- Project categories
- About section (intro and headings)
- Experience section (heading)
- Work section (heading and no results message)
- How I Work section (all content)
- Skills section (headings)
- Articles & Talks section (heading)
- Contact section (all content)
- Footer

## How to Use

### Accessing Different Languages

1. **Default**: The app uses English by default
2. **Switch Language**: Click the language dropdown in the footer
3. **Direct URLs**:
   - English: `http://localhost:3000` or `http://localhost:3000/en`
   - Portuguese: `http://localhost:3000/pt`

### Adding New Translations

1. Open `messages/en.json` and `messages/pt.json`
2. Add new translation keys in the appropriate namespace
3. Use the keys in your components with `useTranslations()`:

```typescript
const t = useTranslations('namespace');
// Then use: {t('key')}
```

### Translation Namespaces

- `nav` - Navigation items
- `categories` - Project categories
- `about` - About section
- `experience` - Experience section
- `work` - Work section
- `approach` - How I Work section
- `skills` - Skills section
- `articles` - Articles & Talks section
- `contact` - Contact section
- `footer` - Footer content
- `common` - Common UI elements (like "Close")

## Technical Details

### Locale Detection
- The middleware automatically detects and redirects to the appropriate locale
- User's browser language preferences are respected
- Once a user selects a language, it persists across navigation

### Route Structure
- All localized pages are under `app/[locale]/`
- API routes remain at `app/api/` (not localized)
- Static assets in `public/` are shared across all locales

### Future Enhancements

To localize additional pages:
1. Move the page to `app/[locale]/your-page/page.tsx`
2. Add translations to both language files
3. Use `useTranslations()` hook in the component

## Ensuring New Features Are Translated

### Automatic Validation

A validation script checks that all translation files have matching keys:

```bash
npm run validate-translations
```

This script:
- ✅ Compares all locale files
- ❌ Reports missing translations
- 📊 Shows total translation key count

### Git Hooks (Optional)

Set up pre-commit hooks to automatically validate translations:

```bash
# See docs/SETUP_GIT_HOOKS.md for instructions
git config core.hooksPath .githooks
```

### Developer Workflow

1. **Add UI text**: Always use `useTranslations()` hook
2. **Add to both files**: Update `en.json` AND `pt.json`
3. **Validate**: Run `npm run validate-translations`
4. **Test**: Switch languages in footer to verify

### Documentation

- **Quick Start**: See `README_TRANSLATIONS.md`
- **Complete Guide**: See `docs/TRANSLATION_GUIDE.md`
- **Git Hooks**: See `docs/SETUP_GIT_HOOKS.md`

## Dependencies

- `next-intl` - Main i18n library for Next.js App Router
- Compatible with Next.js 16 and Clerk authentication

## Browser Support

The language switcher works in all modern browsers and gracefully handles locale switching without page reload where possible.
