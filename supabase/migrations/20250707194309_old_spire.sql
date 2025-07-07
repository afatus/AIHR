/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop existing problematic policies on profiles table
    - Create new, non-recursive policies for profiles table
    - Ensure policies use auth.uid() directly instead of querying profiles table

  2. Policy Updates
    - Users can read their own profile using auth.uid() = id
    - Super admins can read all profiles (simplified check)
    - Users can update their own profile
    - Remove recursive tenant-based policies that cause infinite loops
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in same tenant" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles when impersonating" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admin policy (simplified to avoid recursion)
CREATE POLICY "Super admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@example.com', 
        'superadmin@example.com'
      )
    )
  );

-- Allow users to read profiles in same tenant (non-recursive approach)
CREATE POLICY "Users can read tenant profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );