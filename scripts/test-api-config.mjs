/**
 * Test script to diagnose API config save issues
 * Run with: node scripts/test-api-config.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
let supabaseUrl, serviceRoleKey;
try {
  const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      serviceRoleKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

console.log('🔍 Checking API config table...\n');

// Test 1: Check if table exists
console.log('Test 1: Check if table exists');
try {
  const { data, error } = await supabase
    .from('user_api_configs')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Table access error:', error);
  } else {
    console.log('✅ Table exists and is accessible');
    console.log(`   Found ${data?.length || 0} rows in sample`);
  }
} catch (error) {
  console.log('❌ Exception:', error.message);
}

console.log('\nTest 2: Try to insert a test config');
const testUserId = 'test_user_' + Date.now();
try {
  const { data, error } = await supabase
    .from('user_api_configs')
    .upsert({
      clerk_id: testUserId,
      provider: 'groq',
      api_key: 'test_key_12345',
      is_active: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'clerk_id,provider',
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Insert error:', error);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);
  } else {
    console.log('✅ Insert successful');
    console.log('   ID:', data.id);
    console.log('   Provider:', data.provider);
    
    // Clean up test data
    await supabase
      .from('user_api_configs')
      .delete()
      .eq('clerk_id', testUserId);
    console.log('   Cleaned up test data');
  }
} catch (error) {
  console.log('❌ Exception:', error.message);
}

console.log('\nTest 3: Check table structure');
try {
  const { data, error } = await supabase
    .rpc('exec_sql', { 
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_api_configs'
        ORDER BY ordinal_position;
      `
    });
  
  if (error) {
    console.log('⚠️  Cannot query table structure (this is okay)');
  } else {
    console.log('✅ Table structure:');
    console.table(data);
  }
} catch (error) {
  console.log('⚠️  Cannot query structure:', error.message);
}

console.log('\n📊 Diagnosis complete!');
