/**
 * Server-side Supabase client with service role key for ingestion and admin operations.
 * Use only in API routes or server code; never expose service role to the client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serviceRoleInstance: SupabaseClient | null = null;

export function getSupabaseServiceRole(): SupabaseClient {
  if (serviceRoleInstance) return serviceRoleInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server-side Supabase'
    );
  }

  serviceRoleInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return serviceRoleInstance;
}
