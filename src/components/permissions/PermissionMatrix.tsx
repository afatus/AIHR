import React, { memo } from 'react';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTenantPermissions } from '../../hooks/useTenantPermissions';
import { PermissionList } from './PermissionList';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

export const PermissionMatrix = memo(() => {
  console.log('PermissionMatrix render');
  
  const { permissions, loading, error, updatePermission, refreshPermissions } = useTenantPermissions();

  const defaultPermissions = [
    { key: 'can_login', label: 'Login Access', description: 'Basic login capability' },
    { key: 'can_invite_user', label: 'Invite Users', description: 'Ability to invite new users' },
    { key: 'can_manage_tenant', label: 'Manage Tenant', description: 'Tenant settings and configuration' },
    { key: 'can_manage_users', label: 'Manage Users', description: 'User management and roles' },
    { key: 'can_post_job', label: 'Post Jobs', description: 'Create and manage job postings' },
    { key: 'can_use_ai_video', label: 'AI Video Interviews', description: 'Use AI-powered video interviews' },
    { key: 'can_send_tests', label: 'Send Assessments', description: 'Send personality and skill tests' },
    { key: 'can_edit_permissions', label: 'Edit Permissions', description: 'Modify permission settings' },
    { key: 'can_view_audit_logs', label: 'View Audit Logs', description: 'Access system audit logs' },
    { key: 'can_customize_branding', label: 'Customize Branding', description: 'Change tenant branding' },
    { key: 'can_send_language_test', label: 'Language Tests', description: 'Send language proficiency tests' },
    { key: 'can_manage_roles', label: 'Manage Roles', description: 'Create and modify user roles' },
    { key: 'can_view_system_health', label: 'View System Health', description: 'Monitor system services and performance' },
  ];

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Permission Matrix</h3>
        </div>
        <button
          onClick={refreshPermissions}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">Error loading permissions</p>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      <PermissionList
        permissions={permissions}
        permissionDefinitions={defaultPermissions}
        onUpdatePermission={updatePermission}
      />

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Permission Changes
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Changes to permissions take effect immediately and apply to all users in this tenant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

PermissionMatrix.displayName = 'PermissionMatrix';