import React, { useState } from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardStats } from './components/dashboard/DashboardStats';
import { SystemHealth } from './components/dashboard/SystemHealth';
import { TenantSwitcher } from './components/tenant/TenantSwitcher';
import { PermissionMatrix } from './components/permissions/PermissionMatrix';
import { DebugPanel } from './components/ui/DebugPanel';

function App() {
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Enhanced debug logging
  console.group('🔍 App Render Debug');
  console.log('Loading state:', loading);
  console.log('User exists:', !!user);
  console.log('Profile exists:', !!profile);
  console.log('Current page:', currentPage);
  console.log('Sidebar open:', sidebarOpen);
  if (profile) {
    console.log('Profile details:', {
      id: profile.id,
      email: profile.email,
      tenant_id: profile.tenant_id,
      impersonate_tenant_id: profile.impersonate_tenant_id,
      is_super_admin: profile.is_super_admin,
    });
  }
  console.groupEnd();

  if (loading) {
    console.log('App: Showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log('App: Showing login form - user:', !!user, 'profile:', !!profile);
    return <LoginForm />;
  }

  console.log('App: Rendering main application');

  const renderPage = () => {
    console.log('App: Rendering page:', currentPage);
    
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {profile.full_name}</p>
              </div>
              <TenantSwitcher />
            </div>
            <DashboardStats />
          </div>
        );
      case 'permissions':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
              <p className="text-gray-600">Manage tenant permissions and access control</p>
            </div>
            <PermissionMatrix />
          </div>
        );
      case 'jobs':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
              <p className="text-gray-600">Manage job postings and recruitment</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">Job management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'applications':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
              <p className="text-gray-600">Review and manage job applications</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">Application management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'interviews':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
              <p className="text-gray-600">Manage AI-powered video interviews</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">Interview management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'assessments':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
              <p className="text-gray-600">Create and manage personality and skill assessments</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">Assessment management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600">Manage users and their roles</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">User management interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'tenant':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tenant Settings</h1>
              <p className="text-gray-600">Configure tenant-specific settings and branding</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">Tenant configuration interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">View audit logs and analytics</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">Reporting interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Configure your account and preferences</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <p className="text-gray-500">Settings interface will be implemented here.</p>
            </div>
          </div>
        );
      case 'system-health':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
              <p className="text-gray-600">Monitor system services and performance</p>
            </div>
            <SystemHealth />
          </div>
        );
      default:
        console.log('App: Unknown page, showing dashboard');
        return <DashboardStats />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <ErrorBoundary fallback={
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
            <p className="text-red-800">Sidebar error occurred</p>
          </div>
        }>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </ErrorBoundary>
        
        <div className="lg:ml-64">
          <ErrorBoundary fallback={
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
              <p className="text-red-800">Header error occurred</p>
            </div>
          }>
            <Header
              onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
            />
          </ErrorBoundary>
          
          <main className="p-6">
            <ErrorBoundary fallback={
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Page content error occurred</p>
              </div>
            }>
              {renderPage()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
      
      {/* Debug Panel - only shows in development */}
      <DebugPanel />
    </ErrorBoundary>
  );
}

export default App;