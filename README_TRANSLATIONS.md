# 🌍 Translation System - Quick Start

This project supports **English** and **Portuguese** with automatic validation to ensure all new features are translated.

## 🚀 Quick Start for Developers

### Before Adding Any UI Text

1. **Add translations to BOTH files:**
   - `messages/en.json` (English)
   - `messages/pt.json` (Portuguese)

2. **Use the translation hook:**
   ```typescript
   import { useTranslations } from 'next-intl';
   
   function MyComponent() {
     const t = useTranslations('myFeature');
     return <h1>{t('title')}</h1>;
   }
   ```

3. **Validate before committing:**
   ```bash
   npm run validate-translations
   ```

## 📋 Translation Checklist

Every pull request with UI changes must:

- [ ] All text uses `useTranslations()` hook (no hardcoded strings)
- [ ] Keys added to `messages/en.json`
- [ ] Keys added to `messages/pt.json`
- [ ] `npm run validate-translations` passes
- [ ] Tested in both languages using footer language switcher

## 🛠️ Available Commands

```bash
# Validate all translations match
npm run validate-translations

# Start dev server (with hot-reload translations)
npm run dev

# Build (will fail if translations are invalid)
npm run build
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `messages/en.json` | English translations |
| `messages/pt.json` | Portuguese translations |
| `docs/TRANSLATION_GUIDE.md` | Complete translation guide |
| `scripts/validate-translations.mjs` | Validation script |
| `lib/translations/types.ts` | TypeScript types (optional) |

## 🎯 Common Use Cases

### Adding a New Button

**1. Add to translations:**
```json
// messages/en.json
{
  "common": {
    "saveButton": "Save"
  }
}

// messages/pt.json
{
  "common": {
    "saveButton": "Salvar"
  }
}
```

**2. Use in component:**
```typescript
const t = useTranslations('common');
<button>{t('saveButton')}</button>
```

### Adding a New Page

**1. Create translation namespace:**
```json
// messages/en.json
{
  "settingsPage": {
    "title": "Settings",
    "description": "Manage your preferences"
  }
}
```

**2. Use in page component:**
```typescript
const t = useTranslations('settingsPage');
```

### Dynamic Content

```json
{
  "welcome": "Hello, {name}!"
}
```

```typescript
t('welcome', { name: user.name })
```

## ⚠️ Important Rules

1. **Never commit hardcoded English text** - Always use translations
2. **Add translations for ALL supported languages** - Don't skip Portuguese
3. **Run validation before creating PR** - Catches missing translations early
4. **Test language switching** - Use footer dropdown to switch languages

## 🔄 Workflow

```
1. Write feature code
   ↓
2. Add English translations (en.json)
   ↓
3. Add Portuguese translations (pt.json)
   ↓
4. Run npm run validate-translations
   ↓
5. Test in browser (switch languages)
   ↓
6. Commit (auto-validation runs)
   ↓
7. Create PR
```

## 🆘 Help & Resources

- **Full Guide**: See `docs/TRANSLATION_GUIDE.md`
- **Validation Errors**: Run `npm run validate-translations` for details
- **Need Portuguese Translation**: Use DeepL or ask a native speaker

## 🎓 Examples

Check these files for real examples:
- `app/components/Footer.tsx` - Simple translations
- `app/components/AppMenu.tsx` - Menu translations
- `app/[locale]/page.tsx` - Complex page with multiple namespaces

## 📊 Current Status

Run `npm run validate-translations` to see:
- ✅ Total translation keys: 81
- ✅ Both languages: English, Portuguese
- ✅ All keys synchronized

---

**Remember:** Every user-facing string must be translatable! 🌍
