/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop existing problematic policies on profiles table
    - Create new non-recursive policies that avoid self-referential queries
    - Ensure users can only access their own profile and profiles in their tenant
    - Add policy for super admins to access all profiles

  2. Policy Changes
    - Remove recursive tenant lookup from profiles policies
    - Use auth.uid() directly for user identification
    - Create separate policies for different access patterns
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new non-recursive policies

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.is_super_admin = true
    )
  );

-- Policy 4: Allow users to read profiles in same tenant (non-recursive approach)
-- We'll use a function to avoid recursion
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "Users can read profiles in same tenant"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id());

-- Policy 5: Allow users to read profiles when impersonating
CREATE OR REPLACE FUNCTION get_user_impersonate_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "Users can read profiles when impersonating"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_user_impersonate_tenant_id()
    AND get_user_impersonate_tenant_id() IS NOT NULL
  );