# Translation Guide

## 🌍 Adding Translations for New Features

When adding new features or UI text, **always use translations** instead of hardcoded strings. This ensures all users can experience the platform in their preferred language.

## ✅ Checklist for New Features

Every time you add a new feature with user-facing text:

- [ ] Add English translation keys to `messages/en.json`
- [ ] Add Portuguese translation keys to `messages/pt.json`
- [ ] Use `useTranslations()` hook in your component
- [ ] Run `npm run validate-translations` to check for missing keys
- [ ] Update `lib/translations/types.ts` if adding new namespaces (optional but recommended)

## 📝 Step-by-Step Guide

### 1. Add Translation Keys

**File: `messages/en.json`**
```json
{
  "yourFeature": {
    "title": "My Feature",
    "description": "This is a new feature",
    "buttonLabel": "Click me"
  }
}
```

**File: `messages/pt.json`**
```json
{
  "yourFeature": {
    "title": "Minha Funcionalidade",
    "description": "Esta é uma nova funcionalidade",
    "buttonLabel": "Clique aqui"
  }
}
```

### 2. Use Translations in Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function YourComponent() {
  const t = useTranslations('yourFeature');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('buttonLabel')}</button>
    </div>
  );
}
```

### 3. Validate Translations

Run the validation script to ensure both language files have the same keys:

```bash
npm run validate-translations
```

This will:
- ✅ Check that all locales have the same keys
- ❌ Report missing translations
- ⚠️ Warn about extra keys

## 🎯 Best Practices

### Namespace Organization

Organize translations by feature or component:

```json
{
  "common": { /* shared UI elements */ },
  "nav": { /* navigation */ },
  "dashboard": { /* dashboard page */ },
  "settings": { /* settings page */ },
  "errors": { /* error messages */ }
}
```

### Naming Conventions

- Use **camelCase** for keys: `firstName`, `emailAddress`
- Be **descriptive**: `submitButton` not `btn1`
- Group related items: `form.firstName`, `form.lastName`

### Dynamic Content

For content with variables, use placeholders:

```json
{
  "welcome": "Welcome back, {name}!",
  "itemsCount": "You have {count} items"
}
```

Usage:
```typescript
t('welcome', { name: userName })
t('itemsCount', { count: 5 })
```

### Pluralization

next-intl supports pluralization:

```json
{
  "items": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
}
```

## 🔧 TypeScript Integration

### Update Type Definitions (Optional)

For better type safety, update `lib/translations/types.ts`:

```typescript
export type TranslationKeys = {
  // ... existing keys
  yourFeature: {
    title: string;
    description: string;
    buttonLabel: string;
  };
};
```

This provides:
- ✅ Autocomplete in your IDE
- ✅ Compile-time checking
- ✅ Refactoring safety

## 🚫 What NOT to Do

### ❌ Don't Use Hardcoded Strings

```typescript
// BAD
<h1>Welcome</h1>
<button>Click here</button>

// GOOD
<h1>{t('welcome')}</h1>
<button>{t('clickHere')}</button>
```

### ❌ Don't Skip Locales

Always add translations for ALL supported languages:
- English (en)
- Portuguese (pt)

### ❌ Don't Use Google Translate Blindly

- Ask a native speaker to review
- Consider cultural context
- Test with actual Portuguese-speaking users

## 📦 Adding a New Language

To add a new language (e.g., Spanish):

1. Update `i18n.ts`:
```typescript
export const locales = ['en', 'pt', 'es'] as const;

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
};
```

2. Create `messages/es.json` with all translation keys

3. Update `LOCALES` array in `scripts/validate-translations.mjs`

4. Run validation: `npm run validate-translations`

## 🧪 Testing Translations

### Manual Testing
1. Switch language in the footer dropdown
2. Navigate through all pages
3. Check that all text is translated

### Automated Validation
```bash
# Run before committing
npm run validate-translations

# Run as part of CI/CD
npm run build  # Will fail if translations are invalid
```

## 📚 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [i18n Best Practices](https://phrase.com/blog/posts/i18n-best-practices/)
- Translation Keys Location: `messages/*.json`
- Type Definitions: `lib/translations/types.ts`

## 🆘 Common Issues

### Issue: Key not found error

**Error:** `Missing message: "feature.title"`

**Solution:** 
1. Check if the key exists in both `en.json` and `pt.json`
2. Restart the dev server (`npm run dev`)
3. Clear Next.js cache (`.next` folder)

### Issue: Translation not updating

**Solution:**
1. Restart the dev server
2. Hard refresh browser (Ctrl+Shift+R)
3. Check if you're looking at the correct locale URL

### Issue: Validation script fails

**Solution:**
1. Read the error message carefully
2. Add missing keys to the appropriate locale file
3. Remove extra keys
4. Run `npm run validate-translations` again

## 📞 Need Help?

If you're unsure about translations:
1. Check existing translations for similar patterns
2. Run `npm run validate-translations` to catch issues early
3. Review this guide
4. Ask team for review before merging
