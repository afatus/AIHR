import React, { useState, useEffect, memo } from 'react';
import { Building, ChevronDown, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import type { Tenant } from '../../../lib/supabase';

export const TenantSwitcher = memo(() => {
  console.log('TenantSwitcher render');
  
  const { profile, impersonateTenant, stopImpersonation } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (profile?.is_super_admin) {
      loadTenants();
    }
  }, [profile]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      console.time('loadTenants');
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, subdomain, logo_url')
        .order('name');

      if (error) throw error;
      setTenants(data || []);
      console.timeEnd('loadTenants');
    } catch (error) {
      console.error('Load tenants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSwitch = async (tenantId: string) => {
    try {
      await impersonateTenant(tenantId);
      setIsOpen(false);
    } catch (error) {
      console.error('Switch tenant error:', error);
    }
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
      setIsOpen(false);
    } catch (error) {
      console.error('Stop impersonation error:', error);
    }
  };

  // Only show for super admins
  if (!profile?.is_super_admin) {
    return null;
  }

  const currentTenant = tenants.find(t => t.id === (profile.impersonate_tenant_id || profile.tenant_id));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Building className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">
          {currentTenant?.name || 'Select Tenant'}
        </span>
        {profile.impersonate_tenant_id && (
          <UserCheck className="h-4 w-4 text-yellow-600" />
        )}
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="mb-2 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Available Tenants
            </div>
            
            <div className="space-y-1">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleTenantSwitch(tenant.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                    tenant.id === (profile.impersonate_tenant_id || profile.tenant_id)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {tenant.logo_url ? (
                      <img
                        src={tenant.logo_url}
                        alt={tenant.name}
                        className="h-6 w-6 rounded"
                      />
                    ) : (
                      <div className="h-6 w-6 bg-gray-200 rounded flex items-center justify-center">
                        <Building className="h-3 w-3 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tenant.name}</p>
                    <p className="text-xs text-gray-500 truncate">{tenant.subdomain}</p>
                  </div>
                  {tenant.id === profile.impersonate_tenant_id && (
                    <UserCheck className="h-4 w-4 text-yellow-600" />
                  )}
                </button>
              ))}
            </div>

            {profile.impersonate_tenant_id && (
              <>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={handleStopImpersonation}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left hover:bg-red-50 transition-colors text-red-600"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span className="text-sm font-medium">Stop Impersonation</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

TenantSwitcher.displayName = 'TenantSwitcher';