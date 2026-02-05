#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('\n🚀 Applying Database Schema\n');
console.log('Project:', url);
console.log('');

const supabase = createClient(url, key);

// Read SQL file
const sqlPath = path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql');
const fullSQL = fs.readFileSync(sqlPath, 'utf-8');

// Execute the entire SQL as one transaction
console.log('📄 Executing migrations...\n');

try {
  // Use the SQL function from Supabase (if available)
  const { data, error } = await supabase.rpc('exec', { sql: fullSQL });
  
  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 The SQL needs to be run directly in Supabase SQL Editor.\n');
    console.log('Quick steps:');
    console.log('1. Copy file: supabase/all-migrations-combined.sql');
    console.log('2. Open: https://supabase.com/dashboard/project/qtplretigutndftokplk/sql/new');
    console.log('3. Paste and click Run\n');
    process.exit(1);
  }
  
  console.log('✅ Migrations completed successfully!\n');
  
  // Verify tables
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (!tablesError && tables) {
    console.log('📦 Tables created:');
    tables.forEach(t => console.log(`   ✓ ${t.table_name}`));
  }
  
} catch (err) {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Please run the SQL manually in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/qtplretigutndftokplk/sql/new\n');
}
