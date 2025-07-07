import React, { memo } from 'react';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header = memo<HeaderProps>(({ onMenuToggle, sidebarOpen }) => {
  console.log('Header render');
  
  const { profile, signOut, stopImpersonation } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Impersonation Warning */}
          {profile?.impersonate_tenant_id && (
            <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
              <UserCheck className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Impersonating Tenant
              </span>
              <button
                onClick={stopImpersonation}
                className="text-sm text-yellow-700 hover:text-yellow-900 underline"
              >
                Exit
              </button>
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-2">
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=3B82F6&color=fff`}
                  alt={profile?.full_name}
                  className="h-8 w-8 rounded-full"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profile?.position || 'User'}
                  </p>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
              <div className="py-1">
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <hr className="my-1" />
                <button
                  onClick={signOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';