import { supabase } from '../../lib/supabase';
import type { TenantPermission } from '../../lib/supabase';

export class PermissionService {
  static async getTenantPermissions(tenantId: string): Promise<TenantPermission[]> {
    try {
      console.time('getTenantPermissions');
      const { data, error } = await supabase
        .from('tenant_permissions')
        .select('id, tenant_id, permission_key, enabled, limit_count, valid_from, valid_until, created_at, updated_at')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      console.timeEnd('getTenantPermissions');
      return data || [];
    } catch (error) {
      console.error('Get tenant permissions error:', error);
      return [];
    }
  }

  static async hasPermission(tenantId: string, permissionKey: string): Promise<boolean> {
    try {
      console.time(`hasPermission-${permissionKey}`);
      const { data, error } = await supabase
        .from('tenant_permissions')
        .select('enabled, valid_from, valid_until')
        .eq('tenant_id', tenantId)
        .eq('permission_key', permissionKey)
        .eq('enabled', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) return false;

      // Check if permission is within valid time range
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;

      if (now < validFrom) return false;
      if (validUntil && now > validUntil) return false;

      console.timeEnd(`hasPermission-${permissionKey}`);
      return true;
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }

  static async updatePermission(tenantId: string, permissionKey: string, updates: Partial<TenantPermission>) {
    try {
      console.time(`updatePermission-${permissionKey}`);
      const { data, error } = await supabase
        .from('tenant_permissions')
        .upsert({
          tenant_id: tenantId,
          permission_key: permissionKey,
          ...updates,
        }, {
          onConflict: 'tenant_id,permission_key'
        })
        .select()
        .single();

      if (error) throw error;
      console.timeEnd(`updatePermission-${permissionKey}`);
      return data;
    } catch (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        // Try to update existing record instead
        const { data, error: updateError } = await supabase
          .from('tenant_permissions')
          .update(updates)
          .eq('tenant_id', tenantId)
          .eq('permission_key', permissionKey)
          .select()
          .single();
        
        if (updateError) throw updateError;
        console.timeEnd(`updatePermission-${permissionKey}`);
        return data;
      }
      
      console.error('Update permission error:', error);
      throw new Error(`Failed to update permission: ${error.message}`);
    }
  }

  static async getPermissionUsage(tenantId: string, permissionKey: string): Promise<number> {
    try {
      // This would count actual usage based on the permission type
      // For now, return a placeholder
      return 0;
    } catch (error) {
      console.error('Get permission usage error:', error);
      return 0;
    }
  }
}