#!/usr/bin/env node

/**
 * Sync user emails from Clerk to Supabase
 * Run with: node scripts/sync-user-emails.mjs
 */

import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
} catch (error) {
  console.error('⚠️  Could not load .env.local, using system environment variables');
}

// Load environment variables
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!CLERK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure .env.local has:');
  console.error('  - CLERK_SECRET_KEY');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncEmails() {
  console.log('🔍 Finding users without emails...\n');

  // Get users without emails from Supabase
  const { data: usersWithoutEmails, error: fetchError } = await supabase
    .from('users')
    .select('id, clerk_id, email')
    .is('email', null);

  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError);
    process.exit(1);
  }

  if (!usersWithoutEmails || usersWithoutEmails.length === 0) {
    console.log('✅ All users have emails! Nothing to sync.');
    process.exit(0);
  }

  console.log(`Found ${usersWithoutEmails.length} user(s) without emails:\n`);

  let updated = 0;
  let failed = 0;

  for (const user of usersWithoutEmails) {
    try {
      console.log(`📧 Processing user: ${user.clerk_id}...`);
      
      // Get user from Clerk
      const clerkUser = await clerk.users.getUser(user.clerk_id);
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

      if (!email) {
        console.log(`  ⚠️  No email found in Clerk for this user`);
        failed++;
        continue;
      }

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ email })
        .eq('id', user.id);

      if (updateError) {
        console.log(`  ❌ Failed to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Updated with email: ${email}`);
        updated++;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('═'.repeat(50));
  console.log(`\n📊 Results:`);
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${usersWithoutEmails.length}\n`);

  if (updated > 0) {
    console.log('🎉 Email sync completed successfully!');
  }

  process.exit(failed > 0 ? 1 : 0);
}

syncEmails().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
