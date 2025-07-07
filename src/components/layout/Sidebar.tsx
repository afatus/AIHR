import React, { memo } from 'react';
import { 
  Home, 
  Users, 
  Briefcase, 
  Video, 
  ClipboardList, 
  Settings, 
  BarChart3,
  Shield,
  Building,
  FileText,
  Server,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar = memo<SidebarProps>(({ 
  isOpen, 
  onClose, 
  currentPage, 
  onPageChange 
}) => {
  console.log('Sidebar render');
  
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      permission: 'can_login'
    },
    { 
      id: 'jobs', 
      label: 'Jobs', 
      icon: Briefcase, 
      permission: 'can_post_job'
    },
    { 
      id: 'applications', 
      label: 'Applications', 
      icon: FileText, 
      permission: 'can_post_job'
    },
    { 
      id: 'interviews', 
      label: 'Interviews', 
      icon: Video, 
      permission: 'can_use_ai_video'
    },
    { 
      id: 'assessments', 
      label: 'Assessments', 
      icon: ClipboardList, 
      permission: 'can_send_tests'
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: Users, 
      permission: 'can_manage_users'
    },
    { 
      id: 'permissions', 
      label: 'Permissions', 
      icon: Shield, 
      permission: 'can_edit_permissions'
    },
    { 
      id: 'tenant', 
      label: 'Tenant Settings', 
      icon: Building, 
      permission: 'can_manage_tenant'
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: BarChart3, 
      permission: 'can_view_audit_logs'
    },
    { 
      id: 'system-health', 
      label: 'System Health', 
      icon: Server, 
      permission: 'can_view_system_health'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      permission: 'can_login'
    },
  ];

  const visibleItems = menuItems.filter(item => 
    hasPermission(item.permission) || profile?.is_super_admin
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              RecruiterAI
            </span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="mt-4">
          <div className="px-4 mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Main Menu
            </p>
          </div>
          
          <div className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tenant Info */}
        {profile && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {profile.impersonate_tenant_id ? 'Impersonating' : 'Current Tenant'}
                </p>
                <p className="text-xs text-gray-500">
                  {profile.tenant_id}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';