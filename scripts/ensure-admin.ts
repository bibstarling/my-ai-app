/**
 * Ensure admin access for specific email
 * Run with: npx tsx scripts/ensure-admin.ts
 */

import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'bibstarling@gmail.com';

async function ensureAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log(`Ensuring ${ADMIN_EMAIL} has admin access...`);

  // Update user to have admin access
  const { data, error } = await supabase
    .from('users')
    .update({
      is_admin: true,
      approved: true,
    })
    .eq('email', ADMIN_EMAIL)
    .select();

  if (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log(`No user found with email ${ADMIN_EMAIL}`);
    console.log('The user may not have registered yet.');
  } else {
    console.log('✓ Admin access granted successfully');
    console.log('User:', data[0]);
  }
}

ensureAdmin();
