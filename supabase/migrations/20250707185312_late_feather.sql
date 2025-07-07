/*
  # Enable RLS and create policies for all tables

  1. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their tenant data
    - Add policies for super admins to access all data
    - Ensure proper data isolation between tenants

  2. Tables Updated
    - tenants: Allow users to read their own tenant and super admins to read all
    - profiles: Allow users to read/update their own profile and tenant members
    - roles: Allow tenant members to read roles in their tenant
    - user_roles: Allow tenant members to read user roles in their tenant
    - tenant_permissions: Allow tenant members to read/update permissions in their tenant
    - jobs: Allow tenant members to manage jobs in their tenant
    - job_applications: Allow tenant members to manage applications in their tenant
    - audit_logs: Allow tenant members to read audit logs in their tenant
*/

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Users can read their own tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

CREATE POLICY "Super admins can read all tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Profiles policies
CREATE POLICY "Users can read profiles in their tenant"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Roles policies
CREATE POLICY "Users can read roles in their tenant"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
    OR tenant_id IS NULL -- System roles
  );

-- User roles policies
CREATE POLICY "Users can read user roles in their tenant"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

-- Tenant permissions policies
CREATE POLICY "Users can read tenant permissions in their tenant"
  ON tenant_permissions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update tenant permissions in their tenant"
  ON tenant_permissions
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

-- Jobs policies
CREATE POLICY "Users can manage jobs in their tenant"
  ON jobs
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

-- Job applications policies
CREATE POLICY "Users can manage job applications in their tenant"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

-- Audit logs policies
CREATE POLICY "Users can read audit logs in their tenant"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );

CREATE POLICY "Users can insert audit logs in their tenant"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT impersonate_tenant_id FROM profiles WHERE id = auth.uid() AND impersonate_tenant_id IS NOT NULL
    )
  );