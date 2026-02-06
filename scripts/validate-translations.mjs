#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * This script checks that all translation files have the same keys
 * and warns about missing translations.
 * 
 * Run: node scripts/validate-translations.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCALES = ['en', 'pt'];
const MESSAGES_DIR = join(__dirname, '..', 'messages');

// Helper to get all keys from an object recursively
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Load all translation files
const translations = {};
for (const locale of LOCALES) {
  const filePath = join(MESSAGES_DIR, `${locale}.json`);
  try {
    const content = readFileSync(filePath, 'utf-8');
    translations[locale] = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${locale}.json:`, error.message);
    process.exit(1);
  }
}

// Get all keys from each locale
const localeKeys = {};
for (const locale of LOCALES) {
  localeKeys[locale] = new Set(getAllKeys(translations[locale]));
}

// Compare keys across locales
let hasErrors = false;
const [primaryLocale, ...otherLocales] = LOCALES;
const primaryKeys = localeKeys[primaryLocale];

console.log('🔍 Validating translations...\n');

for (const locale of otherLocales) {
  const currentKeys = localeKeys[locale];
  
  // Check for missing keys in the current locale
  const missingInCurrent = [...primaryKeys].filter(key => !currentKeys.has(key));
  
  // Check for extra keys in the current locale
  const extraInCurrent = [...currentKeys].filter(key => !primaryKeys.has(key));
  
  if (missingInCurrent.length > 0) {
    hasErrors = true;
    console.log(`❌ Missing keys in ${locale}.json (present in ${primaryLocale}.json):`);
    missingInCurrent.forEach(key => console.log(`   - ${key}`));
    console.log();
  }
  
  if (extraInCurrent.length > 0) {
    hasErrors = true;
    console.log(`⚠️  Extra keys in ${locale}.json (not in ${primaryLocale}.json):`);
    extraInCurrent.forEach(key => console.log(`   - ${key}`));
    console.log();
  }
  
  if (missingInCurrent.length === 0 && extraInCurrent.length === 0) {
    console.log(`✅ ${locale}.json has all required keys`);
  }
}

console.log(`\n📊 Total translation keys: ${primaryKeys.size}`);

if (hasErrors) {
  console.log('\n❌ Translation validation failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ All translations are valid!');
  process.exit(0);
}
