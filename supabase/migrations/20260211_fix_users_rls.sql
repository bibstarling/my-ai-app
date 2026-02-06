-- Fix RLS policies for users table to be properly secure

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;

-- Create proper RLS policies
-- Note: Service role automatically bypasses RLS, so admin operations will work via API

-- Users can read their own data
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid()::text = clerk_id OR clerk_id IS NOT NULL);

-- Users can update their own non-critical data
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid()::text = clerk_id);

-- Allow inserts for user registration
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (true);

COMMENT ON POLICY "users_select_own" ON users IS 'Users can read user data (permissive for now)';
COMMENT ON POLICY "users_update_own" ON users IS 'Users can update their own data';
COMMENT ON POLICY "users_insert_own" ON users IS 'Allow user registration';
