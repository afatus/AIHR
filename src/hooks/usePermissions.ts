import { useState, useEffect, useCallback } from 'react';
import { PermissionService } from '../lib/permissions';
import { useAuth } from './useAuth';
import type { TenantPermission } from '../../lib/supabase';

export const usePermissions = () => {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<TenantPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!profile) {
      console.log('usePermissions: No profile, clearing permissions');
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      console.time('usePermissions-loadPermissions');
      console.log('usePermissions: Loading permissions for tenant:', profile.impersonate_tenant_id || profile.tenant_id);
      const tenantId = profile.impersonate_tenant_id || profile.tenant_id;
      const tenantPermissions = await PermissionService.getTenantPermissions(tenantId);
      setPermissions(tenantPermissions);
      console.log('usePermissions: Loaded permissions:', tenantPermissions.length);
      console.timeEnd('usePermissions-loadPermissions');
    } catch (error) {
      console.error('Load permissions error:', error);
      setPermissions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    console.log('usePermissions: Effect triggered, profile:', !!profile);
    loadPermissions();
  }, [loadPermissions]);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (!profile) return false;
    
    // Super admins have all permissions
    if (profile.is_super_admin) {
      console.log(`usePermissions: Super admin access granted for ${permissionKey}`);
      return true;
    }

    const permission = permissions.find(p => p.permission_key === permissionKey);
    if (!permission) {
      console.log(`usePermissions: Permission ${permissionKey} not found`);
      return false;
    }

    // Check if permission is within valid time range
    const now = new Date();
    const validFrom = new Date(permission.valid_from);
    const validUntil = permission.valid_until ? new Date(permission.valid_until) : null;

    if (now < validFrom) {
      console.log(`usePermissions: Permission ${permissionKey} not yet valid`);
      return false;
    }
    if (validUntil && now > validUntil) {
      console.log(`usePermissions: Permission ${permissionKey} expired`);
      return false;
    }

    console.log(`usePermissions: Permission ${permissionKey} check result:`, permission.enabled);
    return permission.enabled;
  }, [profile, permissions]);

  const getPermissionLimit = useCallback((permissionKey: string): number => {
    const permission = permissions.find(p => p.permission_key === permissionKey);
    return permission?.limit_count || 0;
  }, [permissions]);

  return {
    permissions,
    loading,
    hasPermission,
    getPermissionLimit,
  };
};