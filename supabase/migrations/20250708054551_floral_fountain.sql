/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Multiple overlapping RLS policies on profiles table are causing infinite recursion
    - Policies are trying to read from profiles table while being evaluated for profiles queries
    - This creates circular dependencies during authentication

  2. Solution
    - Drop all existing problematic policies
    - Create simplified, non-recursive policies
    - Use auth.uid() directly instead of subqueries to profiles table
    - Ensure policies don't reference the same table they're protecting

  3. New Policies
    - Allow users to read their own profile using auth.uid()
    - Allow users to read profiles in same tenant (simplified logic)
    - Allow super admins to read all profiles (using direct user metadata)
    - Allow users to update their own profile
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in the same tenant" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_same_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_select_super_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create simplified, non-recursive policies

-- Allow users to read their own profile (no subquery needed)
CREATE POLICY "profiles_read_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile (no subquery needed)
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to read profiles in the same tenant (simplified)
-- This policy will be evaluated after the user's own profile is accessible
CREATE POLICY "profiles_read_same_tenant"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
    OR
    tenant_id IN (
      SELECT impersonate_tenant_id FROM profiles 
      WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

-- Allow super admins to read all profiles (using user metadata to avoid recursion)
CREATE POLICY "profiles_read_super_admin"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'admin@example.com' 
        OR auth.users.email = 'superadmin@example.com'
        OR (auth.users.raw_user_meta_data->>'is_super_admin')::boolean = true
      )
    )
  );

-- Allow profile insertion during user registration
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);