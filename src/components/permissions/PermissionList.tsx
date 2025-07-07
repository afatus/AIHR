import React, { memo, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PermissionItem } from './PermissionItem';
import type { TenantPermission } from '../../../lib/supabase';

interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
}

interface PermissionListProps {
  permissions: TenantPermission[];
  permissionDefinitions: PermissionDefinition[];
  onUpdatePermission: (permissionKey: string, enabled: boolean, limitCount?: number) => Promise<void>;
}

export const PermissionList = memo<PermissionListProps>(({
  permissions,
  permissionDefinitions,
  onUpdatePermission,
}) => {
  console.log('PermissionList render');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const permissionMap = useMemo(() => {
    const map: Record<string, TenantPermission> = {};
    permissions.forEach(p => map[p.permission_key] = p);
    return map;
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    return permissionDefinitions.filter(permission =>
      permission.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [permissionDefinitions, searchTerm]);

  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPermissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPermissions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);

  const handlePermissionToggle = async (permissionKey: string, enabled: boolean) => {
    const currentPermission = permissionMap[permissionKey];
    await onUpdatePermission(permissionKey, enabled, currentPermission?.limit_count || 0);
  };

  const handleLimitChange = async (permissionKey: string, limitCount: number) => {
    const currentPermission = permissionMap[permissionKey];
    await onUpdatePermission(permissionKey, currentPermission?.enabled || false, limitCount);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Permission Items */}
      <div className="space-y-3">
        {paginatedPermissions.map((permission) => {
          const status = permissionMap[permission.key] || { enabled: false, limit_count: 0 };
          const hasLimit = ['can_post_job', 'can_use_ai_video', 'can_send_tests'].includes(permission.key);
          
          return (
            <PermissionItem
              key={permission.key}
              permissionKey={permission.key}
              label={permission.label}
              description={permission.description}
              enabled={status.enabled}
              limitCount={status.limit_count}
              hasLimit={hasLimit}
              onToggle={(enabled) => handlePermissionToggle(permission.key, enabled)}
              onLimitChange={(limit) => handleLimitChange(permission.key, limit)}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPermissions.length)} of {filteredPermissions.length} permissions
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

PermissionList.displayName = 'PermissionList';