/*
  # Create default admin user and tenant

  1. New Tables
    - Creates a default tenant for testing
    - Sets up initial system roles

  2. Default Data
    - Creates a default tenant "Demo Company"
    - Creates system roles (admin, user, hr_manager)
    - Note: You'll need to create the actual auth user in Supabase dashboard

  3. Instructions
    - After running this migration, create a user in Supabase Auth with email: admin@demo.com
    - The profile will be automatically linked when the user signs up
*/

-- Insert default tenant
INSERT INTO tenants (
  id,
  name,
  subdomain,
  primary_color,
  secondary_color,
  subscription_plan,
  max_users,
  max_jobs
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo',
  '#3B82F6',
  '#6366F1',
  'free',
  5,
  10
) ON CONFLICT (id) DO NOTHING;

-- Insert system roles
INSERT INTO roles (
  id,
  tenant_id,
  name,
  description,
  is_system_role
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'super_admin',
    'Super Administrator with full system access',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Tenant Administrator',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'hr_manager',
    'HR Manager with job and application management',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'user',
    'Standard User',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    tenant_id,
    email,
    full_name,
    is_super_admin
  )
  VALUES (
    new.id,
    '00000000-0000-0000-0000-000000000001',
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email = 'admin@demo.com' THEN true
      ELSE false
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();