/*
  # Temiz ve Stabil RLS Politikaları

  1. Temizlik
    - Tüm mevcut çakışan politikaları sil
    - Gereksiz fonksiyonları kaldır
    - Temiz bir başlangıç yap

  2. Güvenlik Kuralları
    - Her tablo için basit ve anlaşılır politikalar
    - Sonsuz döngü riski olmayan kurallar
    - Multi-tenant yapıya uygun veri izolasyonu
    - Super admin erişimi

  3. Tablolar
    - tenants: Kullanıcılar kendi tenant'larını okuyabilir
    - profiles: Kullanıcılar kendi profillerini yönetebilir
    - roles: Tenant içindeki roller okunabilir
    - user_roles: Tenant içindeki kullanıcı rolleri yönetilebilir
    - tenant_permissions: Tenant izinleri yönetilebilir
    - jobs: Tenant içindeki işler yönetilebilir
    - job_applications: Tenant içindeki başvurular yönetilebilir
    - audit_logs: Tenant içindeki loglar okunabilir
*/

-- =====================================================
-- 1. TEMİZLİK: Tüm mevcut politikaları sil
-- =====================================================

-- Tenants tablosu politikaları
DROP POLICY IF EXISTS "Users can read their own tenant" ON tenants;
DROP POLICY IF EXISTS "Super admins can read all tenants" ON tenants;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tenants;

-- Profiles tablosu politikaları
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in their tenant" ON profiles;
DROP POLICY IF EXISTS "Users can read tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles in same tenant" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles when impersonating" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;

-- Roles tablosu politikaları
DROP POLICY IF EXISTS "Users can read roles in their tenant" ON roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON roles;

-- User_roles tablosu politikaları
DROP POLICY IF EXISTS "Users can read user roles in their tenant" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;

-- Tenant_permissions tablosu politikaları
DROP POLICY IF EXISTS "Users can read tenant permissions in their tenant" ON tenant_permissions;
DROP POLICY IF EXISTS "Users can update tenant permissions in their tenant" ON tenant_permissions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tenant_permissions;

-- Jobs tablosu politikaları
DROP POLICY IF EXISTS "Users can manage jobs in their tenant" ON jobs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON jobs;

-- Job_applications tablosu politikaları
DROP POLICY IF EXISTS "Users can manage job applications in their tenant" ON job_applications;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON job_applications;

-- Audit_logs tablosu politikaları
DROP POLICY IF EXISTS "Users can read audit logs in their tenant" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs in their tenant" ON audit_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audit_logs;

-- Gereksiz fonksiyonları sil
DROP FUNCTION IF EXISTS get_user_tenant_id();
DROP FUNCTION IF EXISTS get_user_impersonate_tenant_id();

-- =====================================================
-- 2. RLS'yi tüm tablolarda etkinleştir
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. TENANTS TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi tenant'larını okuyabilir
CREATE POLICY "tenants_select_own"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT tenant_id 
      FROM profiles 
      WHERE id = auth.uid()
      LIMIT 1
    )
    OR
    id = (
      SELECT impersonate_tenant_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- Super adminler tüm tenant'ları okuyabilir
CREATE POLICY "tenants_select_super_admin"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE id = auth.uid() 
      AND is_super_admin = true
    )
  );

-- =====================================================
-- 4. PROFILES TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi profillerini okuyabilir
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Super adminler tüm profilleri okuyabilir
CREATE POLICY "profiles_select_super_admin"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.is_super_admin = true
    )
  );

-- Kullanıcılar aynı tenant'taki profilleri okuyabilir
CREATE POLICY "profiles_select_same_tenant"
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
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- =====================================================
-- 5. ROLES TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi tenant'larındaki rolleri okuyabilir
CREATE POLICY "roles_select_tenant"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
    OR
    tenant_id IS NULL -- Sistem rolleri
  );

-- =====================================================
-- 6. USER_ROLES TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi tenant'larındaki kullanıcı rollerini okuyabilir
CREATE POLICY "user_roles_select_tenant"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- Kullanıcılar kendi tenant'larında kullanıcı rolleri ekleyebilir
CREATE POLICY "user_roles_insert_tenant"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- =====================================================
-- 7. TENANT_PERMISSIONS TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi tenant'larının izinlerini okuyabilir
CREATE POLICY "tenant_permissions_select_tenant"
  ON tenant_permissions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- Kullanıcılar kendi tenant'larının izinlerini yönetebilir
CREATE POLICY "tenant_permissions_manage_tenant"
  ON tenant_permissions
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- =====================================================
-- 8. JOBS TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi tenant'larındaki işleri yönetebilir
CREATE POLICY "jobs_manage_tenant"
  ON jobs
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- =====================================================
-- 9. JOB_APPLICATIONS TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi tenant'larındaki başvuruları yönetebilir
CREATE POLICY "job_applications_manage_tenant"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- =====================================================
-- 10. AUDIT_LOGS TABLOSU POLİTİKALARI
-- =====================================================

-- Kullanıcılar kendi tenant'larındaki logları okuyabilir
CREATE POLICY "audit_logs_select_tenant"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- Kullanıcılar kendi tenant'larına log ekleyebilir
CREATE POLICY "audit_logs_insert_tenant"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    OR
    tenant_id = (
      SELECT p.impersonate_tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.impersonate_tenant_id IS NOT NULL
      LIMIT 1
    )
  );

-- =====================================================
-- 11. VARSAYILAN VERİLER
-- =====================================================

-- Varsayılan tenant oluştur (eğer yoksa)
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
  'Demo Şirketi',
  'demo',
  '#3B82F6',
  '#6366F1',
  'free',
  5,
  10
) ON CONFLICT (id) DO NOTHING;

-- Sistem rollerini oluştur (eğer yoksa)
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
    'Tam sistem erişimi olan süper yönetici',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Tenant Yöneticisi',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'hr_manager',
    'İş ve başvuru yönetimi yapan İK Müdürü',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'user',
    'Standart Kullanıcı',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Yeni kullanıcı kaydı için trigger fonksiyonu
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
      WHEN new.email IN ('admin@demo.com', 'superadmin@demo.com') THEN true
      ELSE false
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();