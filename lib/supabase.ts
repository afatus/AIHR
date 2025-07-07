import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      roles: {
        Row: Role;
        Insert: Omit<Role, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Role, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, 'id' | 'assigned_at'>;
        Update: Partial<Omit<UserRole, 'id' | 'assigned_at'>>;
      };
      tenant_permissions: {
        Row: TenantPermission;
        Insert: Omit<TenantPermission, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TenantPermission, 'id' | 'created_at' | 'updated_at'>>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;
      };
      job_applications: {
        Row: JobApplication;
        Insert: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  openai_api_key?: string;
  gemini_api_key?: string;
  video_service_key?: string;
  subscription_plan: string;
  max_users: number;
  max_jobs: number;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  position?: string;
  department?: string;
  is_super_admin: boolean;
  impersonate_tenant_id?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  tenant_id: string;
  assigned_by?: string;
  assigned_at: string;
}

export interface TenantPermission {
  id: string;
  tenant_id: string;
  permission_key: string;
  limit_count: number;
  enabled: boolean;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  department?: string;
  experience_level?: string;
  status: string;
  posted_by?: string;
  posted_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  tenant_id: string;
  candidate_email: string;
  candidate_name: string;
  candidate_phone?: string;
  resume_url?: string;
  cover_letter?: string;
  status: string;
  ai_score?: number;
  ai_feedback?: any;
  interview_scheduled_at?: string;
  interview_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  impersonated_from?: string;
  created_at: string;
}