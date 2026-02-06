#!/usr/bin/env node
/**
 * Force reset API configuration to use system API
 * This will deactivate any user API configs and force the app to use the system Anthropic key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Force Reset API Configuration');
console.log('================================\n');

// Get your Clerk user ID (you can find this in Clerk dashboard or console logs)
const clerkUserId = process.argv[2];

if (!clerkUserId) {
  console.log('📋 First, let me show you all API configs in the database:\n');
  
  const { data: allConfigs, error } = await supabase
    .from('user_api_configs')
    .select('clerk_id, provider, is_active, created_at, updated_at')
    .eq('is_active', true);
  
  if (error) {
    console.error('❌ Error querying database:', error.message);
    process.exit(1);
  }
  
  if (!allConfigs || allConfigs.length === 0) {
    console.log('✅ No active API configs found!');
    console.log('   All users are using the system API (Anthropic).');
    console.log('\n💡 If you\'re still getting unauthorized errors, the issue might be:');
    console.log('   1. The system ANTHROPIC_API_KEY in .env.local is invalid');
    console.log('   2. There\'s an authentication issue with Clerk');
    console.log('   3. Check your browser console and server logs for details');
  } else {
    console.log(`Found ${allConfigs.length} active API config(s):\n`);
    allConfigs.forEach((config, i) => {
      console.log(`${i + 1}. User: ${config.clerk_id}`);
      console.log(`   Provider: ${config.provider}`);
      console.log(`   Active: ${config.is_active}`);
      console.log(`   Updated: ${config.updated_at}`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('To deactivate a specific user\'s config, run:');
    console.log('  node scripts/force-reset-api-config.mjs <clerk_user_id>\n');
    console.log('To deactivate ALL configs (everyone uses system API):');
    console.log('  node scripts/force-reset-api-config.mjs ALL\n');
  }
  
  process.exit(0);
}

// Reset specific user or all users
if (clerkUserId === 'ALL') {
  console.log('⚠️  Deactivating ALL user API configurations...\n');
  
  const { data, error } = await supabase
    .from('user_api_configs')
    .update({ is_active: false })
    .eq('is_active', true)
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ Deactivated ${data?.length || 0} config(s)`);
  console.log('   All users will now use the system Anthropic API.\n');
  
} else {
  console.log(`⚠️  Deactivating API config for user: ${clerkUserId}\n`);
  
  const { data, error } = await supabase
    .from('user_api_configs')
    .update({ is_active: false })
    .eq('clerk_id', clerkUserId)
    .eq('is_active', true)
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  if (!data || data.length === 0) {
    console.log('ℹ️  No active config found for this user.');
    console.log('   User is already using the system API.\n');
  } else {
    console.log(`✅ Deactivated ${data.length} config(s) for this user:`);
    data.forEach(config => {
      console.log(`   - ${config.provider}`);
    });
    console.log('');
    console.log('   This user will now use the system Anthropic API.\n');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ Next steps:');
console.log('   1. Refresh your app in the browser');
console.log('   2. Try using any AI feature');
console.log('   3. Check the server logs to confirm it says:');
console.log('      "[AI Provider] Using system fallback"');
console.log('');
