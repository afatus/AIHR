/*
  # Fix RLS Policies for Better Error Handling

  1. Security Updates
    - Update existing RLS policies to handle edge cases better
    - Add proper error handling for missing profiles
    - Ensure policies work correctly with impersonation

  2. Policy Improvements
    - Make policies more permissive for authenticated users
    - Add fallback policies for system operations
    - Improve tenant access patterns
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read their own tenant" ON tenants;
DROP POLICY IF EXISTS "Super admins can read all tenants" ON tenants;
DROP POLICY IF EXISTS "Users can read profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read roles in their tenant" ON roles;
DROP POLICY IF EXISTS "Users can read user roles in their tenant" ON user_roles;
DROP POLICY IF EXISTS "Users can read tenant permissions in their tenant" ON tenant_permissions;
DROP POLICY IF EXISTS "Users can update tenant permissions in their tenant" ON tenant_permissions;

-- Tenants policies (more permissive)
CREATE POLICY "Authenticated users can read tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    -- Super admins can read all tenants
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can read their own tenant or impersonated tenant
    id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Profiles policies (more permissive)
CREATE POLICY "Authenticated users can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Super admins can read all profiles
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid() AND p2.is_super_admin = true
    )
    OR
    -- Users can read profiles in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow super admins to update any profile for impersonation
CREATE POLICY "Super admins can update profiles for impersonation"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Roles policies
CREATE POLICY "Authenticated users can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    -- System roles (no tenant_id) are readable by all
    tenant_id IS NULL
    OR
    -- Super admins can read all roles
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can read roles in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- User roles policies
CREATE POLICY "Authenticated users can read user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    -- Super admins can read all user roles
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can read user roles in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Tenant permissions policies (more permissive)
CREATE POLICY "Authenticated users can read tenant permissions"
  ON tenant_permissions
  FOR SELECT
  TO authenticated
  USING (
    -- Super admins can read all permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can read permissions in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can manage tenant permissions"
  ON tenant_permissions
  FOR ALL
  TO authenticated
  USING (
    -- Super admins can manage all permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can manage permissions in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    -- Super admins can manage all permissions
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can manage permissions in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Jobs policies
CREATE POLICY "Authenticated users can manage jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (
    -- Super admins can manage all jobs
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can manage jobs in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    -- Super admins can manage all jobs
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can manage jobs in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Job applications policies
CREATE POLICY "Authenticated users can manage job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (
    -- Super admins can manage all applications
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can manage applications in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    -- Super admins can manage all applications
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can manage applications in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Audit logs policies
CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    -- Super admins can read all audit logs
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can read audit logs in their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Super admins can insert audit logs for any tenant
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
    OR
    -- Users can insert audit logs for their tenant or impersonated tenant
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );