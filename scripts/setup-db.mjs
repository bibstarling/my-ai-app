#!/usr/bin/env node
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

console.log('\n' + '='.repeat(70));
console.log('🚀 SUPABASE DATABASE SETUP');
console.log('='.repeat(70));
console.log('\n📋 Quick 2-Step Process:\n');
console.log('1. ✅ SQL file copied to clipboard');
console.log('2. 🌐 Opening Supabase SQL Editor...');
console.log('3. 📝 Paste (Ctrl+V) and click "Run"\n');

// Copy to clipboard
try {
  // Windows
  const proc = exec('clip');
  proc.stdin.write(sql);
  proc.stdin.end();
  console.log('✅ SQL copied to clipboard!\n');
} catch (error) {
  console.log('⚠️  Could not copy to clipboard automatically\n');
  console.log('📁 File location: supabase/all-migrations-combined.sql\n');
}

// Open browser
const url = 'https://supabase.com/dashboard/project/qtplretigutndftokplk/sql/new';
console.log('🌐 Opening SQL Editor...\n');

try {
  // Windows
  exec(`start ${url}`);
} catch (error) {
  console.log(`Please open: ${url}\n`);
}

console.log('='.repeat(70));
console.log('📦 TABLES THAT WILL BE CREATED:');
console.log('='.repeat(70));
console.log(`
  ✓ jobs                    - Job listings from multiple sources
  ✓ job_sources             - Raw API data from job boards
  ✓ job_sync_metrics        - Sync status and health metrics
  ✓ user_job_profiles       - User skills and preferences
  ✓ resumes                 - User resume records
  ✓ resume_sections         - Resume content sections
  ✓ resume_adaptations      - Job-specific tailored resumes
  ✓ cover_letters           - AI-generated cover letters
  ✓ tracked_jobs            - User's saved/applied jobs
`);
console.log('='.repeat(70));
console.log('✨ After clicking "Run", your database will be ready!');
console.log('='.repeat(70) + '\n');
