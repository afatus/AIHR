import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/supabase';

export interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export class AuthService {
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile
      const profile = await this.getProfile(data.user.id);
      
      // Log successful login
      await this.logAction('login', null, null, { email });

      return { user: data.user, profile };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await this.logAction('logout', null, null, {});
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.group('👤 AuthService.getProfile');
      console.log('User ID:', userId);
      console.time('profile-query');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, tenant_id, email, full_name, avatar_url, phone, position, department, is_super_admin, impersonate_tenant_id, last_login, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile query error:', error);
        console.log('Error code:', error.code);
        console.log('Error details:', error.details);
        console.groupEnd();
        throw error;
      }

      if (!data) {
        console.warn('No profile found for user:', userId);
        console.timeEnd('profile-query');
        console.groupEnd();
        return null;
      }

      console.timeEnd('profile-query');
      console.log('✅ Profile loaded successfully');
      console.groupEnd();
      return data;
    } catch (error) {
      console.group('❌ AuthService.getProfile Error');
      console.error('Error:', error);
      console.trace('Stack trace');
      console.groupEnd();
      throw error; // Re-throw to handle in useAuth
    }
  }

  static async updateProfile(updates: Partial<Profile>) {
    try {
      console.time('updateProfile');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', updates.id)
        .select()
        .single();

      if (error) throw error;

      await this.logAction('update_profile', 'profile', updates.id, updates);
      console.timeEnd('updateProfile');
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  static async inviteUser(email: string, tenantId: string, roleId: string) {
    try {
      console.time('inviteUser');
      // This would typically send an invitation email
      // For now, we'll just create a placeholder profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email,
          tenant_id: tenantId,
          full_name: email.split('@')[0],
        });

      if (error) throw error;

      await this.logAction('invite_user', 'profile', null, { email, tenantId, roleId });
      console.timeEnd('inviteUser');
      return data;
    } catch (error) {
      console.error('Invite user error:', error);
      throw error;
    }
  }

  static async impersonateTenant(tenantId: string) {
    try {
      console.time('impersonateTenant');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({ impersonate_tenant_id: tenantId })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      await this.logAction('impersonate_tenant', 'tenant', tenantId, { original_tenant_id: data.tenant_id });
      console.timeEnd('impersonateTenant');
      return data;
    } catch (error) {
      console.error('Impersonate tenant error:', error);
      throw error;
    }
  }

  static async stopImpersonation() {
    try {
      console.time('stopImpersonation');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update({ impersonate_tenant_id: null })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      await this.logAction('stop_impersonation', 'tenant', null, {});
      console.timeEnd('stopImpersonation');
      return data;
    } catch (error) {
      console.error('Stop impersonation error:', error);
      throw error;
    }
  }

  static async logAction(action: string, resourceType?: string, resourceId?: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const profile = user ? await this.getProfile(user.id) : null;

      await supabase.from('audit_logs').insert({
        tenant_id: profile?.impersonate_tenant_id || profile?.tenant_id || '',
        user_id: user?.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent,
        impersonated_from: profile?.impersonate_tenant_id ? profile.tenant_id : null,
      });
    } catch (error) {
      console.error('Log action error:', error);
    }
  }
}