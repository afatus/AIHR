import { useState, useEffect, useCallback } from 'react';
import { PermissionService } from '../lib/permissions';
import { useAuth } from './useAuth';
import type { TenantPermission } from '../../lib/supabase';

interface UseTenantPermissionsReturn {
  permissions: TenantPermission[];
  loading: boolean;
  error: string | null;
  updatePermission: (permissionKey: string, enabled: boolean, limitCount?: number) => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

export const useTenantPermissions = (): UseTenantPermissionsReturn => {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<TenantPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!profile) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      console.time('loadPermissions');
      setError(null);
      const tenantId = profile.impersonate_tenant_id || profile.tenant_id;
      const tenantPermissions = await PermissionService.getTenantPermissions(tenantId);
      setPermissions(tenantPermissions);
      console.timeEnd('loadPermissions');
    } catch (error) {
      console.error('Load permissions error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const updatePermission = useCallback(async (permissionKey: string, enabled: boolean, limitCount?: number) => {
    if (!profile) return;

    try {
      console.time(`updatePermission-${permissionKey}`);
      const tenantId = profile.impersonate_tenant_id || profile.tenant_id;
      
      await PermissionService.updatePermission(tenantId, permissionKey, {
        enabled,
        limit_count: limitCount || 0,
      });

      // Update local state instead of reloading all permissions
      setPermissions((prev) => {
        const existingIndex = prev.findIndex(p => p.permission_key === permissionKey);
        
        if (existingIndex >= 0) {
          // Update existing permission
          return prev.map((p) =>
            p.permission_key === permissionKey 
              ? { ...p, enabled, limit_count: limitCount || 0, updated_at: new Date().toISOString() } 
              : p
          );
        } else {
          // Add new permission if it doesn't exist
          return [...prev, {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            permission_key: permissionKey,
            enabled,
            limit_count: limitCount || 0,
            valid_from: new Date().toISOString(),
            valid_until: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }];
        }
      });
      
      console.timeEnd(`updatePermission-${permissionKey}`);
    } catch (error) {
      console.error('Update permission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update permission');
    }
  }, [profile]);

  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  return {
    permissions,
    loading,
    error,
    updatePermission,
    refreshPermissions,
  };
};