/*
  # Multi-Tenant Recruitment Platform Schema

  1. Core Tables
    - `tenants` - Company/organization information with branding and API keys
    - `profiles` - User profiles linked to auth.users
    - `roles` - System roles definition
    - `user_roles` - User-role assignments per tenant
    - `tenant_permissions` - Feature permissions per tenant
    - `audit_logs` - System activity logging

  2. Security
    - Enable RLS on all tables
    - Add policies for tenant isolation
    - Super admin impersonation support

  3. Features
    - Job posting and management
    - AI interview integration
    - Test and assessment system
    - Permission-based feature access
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#6366F1',
  smtp_host text,
  smtp_port integer,
  smtp_user text,
  smtp_password text,
  openai_api_key text,
  gemini_api_key text,
  video_service_key text,
  subscription_plan text DEFAULT 'free',
  max_users integer DEFAULT 5,
  max_jobs integer DEFAULT 10,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  phone text,
  position text,
  department text,
  is_super_admin boolean DEFAULT false,
  impersonate_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, tenant_id)
);

-- Tenant permissions table (tenant_id can be NULL for default permissions)
CREATE TABLE IF NOT EXISTS tenant_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  limit_count integer DEFAULT 0,
  enabled boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, permission_key)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  location text,
  employment_type text NOT NULL,
  salary_min numeric,
  salary_max numeric,
  currency text DEFAULT 'USD',
  department text,
  experience_level text,
  status text DEFAULT 'draft',
  posted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  posted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_email text NOT NULL,
  candidate_name text NOT NULL,
  candidate_phone text,
  resume_url text,
  cover_letter text,
  status text DEFAULT 'pending',
  ai_score numeric,
  ai_feedback jsonb,
  interview_scheduled_at timestamptz,
  interview_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  impersonated_from uuid REFERENCES tenants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_permissions_updated_at
    BEFORE UPDATE ON tenant_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for tenants
CREATE POLICY "Users can view their own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all tenants"
  ON tenants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Policies for profiles
CREATE POLICY "Users can view profiles in their tenant"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Super admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Policies for roles
CREATE POLICY "Users can view roles in their tenant"
  ON roles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    ) OR tenant_id IS NULL
  );

-- Policies for user_roles
CREATE POLICY "Users can view user roles in their tenant"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Policies for tenant_permissions
CREATE POLICY "Users can view permissions for their tenant"
  ON tenant_permissions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    ) OR tenant_id IS NULL
  );

CREATE POLICY "Super admins can manage all permissions"
  ON tenant_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Policies for jobs
CREATE POLICY "Users can view jobs in their tenant"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage jobs in their tenant"
  ON jobs FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Policies for job_applications
CREATE POLICY "Users can view applications in their tenant"
  ON job_applications FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage applications in their tenant"
  ON job_applications FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Policies for audit logs
CREATE POLICY "Users can view audit logs for their tenant"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT COALESCE(impersonate_tenant_id, tenant_id) 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_permissions_tenant_id ON tenant_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_tenant_id ON job_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default system roles (these are global, not tenant-specific)
INSERT INTO roles (id, tenant_id, name, description, is_system_role) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'Super Admin', 'Full system access', true),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Tenant Admin', 'Tenant administration', true),
  ('00000000-0000-0000-0000-000000000003', NULL, 'HR Manager', 'Human resources management', true),
  ('00000000-0000-0000-0000-000000000004', NULL, 'Recruiter', 'Recruitment and hiring', true),
  ('00000000-0000-0000-0000-000000000005', NULL, 'Interviewer', 'Interview management', true),
  ('00000000-0000-0000-0000-000000000006', NULL, 'Viewer', 'Read-only access', true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Insert default permissions (these are global defaults, not tenant-specific)
INSERT INTO tenant_permissions (tenant_id, permission_key, enabled) VALUES
  (NULL, 'can_login', true),
  (NULL, 'can_invite_user', true),
  (NULL, 'can_manage_tenant', true),
  (NULL, 'can_manage_users', true),
  (NULL, 'can_post_job', true),
  (NULL, 'can_use_ai_video', true),
  (NULL, 'can_send_tests', true),
  (NULL, 'can_edit_permissions', true),
  (NULL, 'can_view_audit_logs', true),
  (NULL, 'can_customize_branding', true),
  (NULL, 'can_send_language_test', true),
  (NULL, 'can_manage_roles', true)
ON CONFLICT (tenant_id, permission_key) DO NOTHING;