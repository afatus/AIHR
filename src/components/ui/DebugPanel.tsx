import React, { memo, useState } from 'react';
import { Bug, ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

interface DebugInfo {
  timestamp: string;
  type: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

export const DebugPanel = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugInfo[]>([]);
  const { user, profile, loading, error } = useAuth();
  const { permissions, loading: permissionsLoading } = usePermissions();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const addLog = (type: DebugInfo['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    }].slice(-50)); // Keep only last 50 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      auth: {
        user: !!user,
        profile: !!profile,
        loading,
        error,
      },
      permissions: {
        count: permissions.length,
        loading: permissionsLoading,
      },
      environment: {
        supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
        supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      logs: logs.slice(-10), // Last 10 logs
    };

    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
    addLog('info', 'Debug info copied to clipboard');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-gray-900 text-white rounded-lg shadow-lg transition-all duration-300 ${
        isOpen ? 'w-96 h-80' : 'w-auto h-auto'
      }`}>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Bug className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">Debug Panel</span>
          </div>
          <div className="flex items-center space-x-2">
            {isOpen && (
              <>
                <button
                  onClick={copyDebugInfo}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Copy debug info"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={clearLogs}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Clear logs"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="p-3 space-y-3 h-64 overflow-y-auto">
            {/* Auth Status */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-300">Authentication</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>User:</span>
                  <span className={user ? 'text-green-400' : 'text-red-400'}>
                    {user ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profile:</span>
                  <span className={profile ? 'text-green-400' : 'text-red-400'}>
                    {profile ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span className={loading ? 'text-yellow-400' : 'text-gray-400'}>
                    {loading ? 'Yes' : 'No'}
                  </span>
                </div>
                {error && (
                  <div className="text-red-400 text-xs break-words">
                    Error: {error}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Status */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-300">Permissions</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Count:</span>
                  <span className="text-blue-400">{permissions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <span className={permissionsLoading ? 'text-yellow-400' : 'text-gray-400'}>
                    {permissionsLoading ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Environment */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-300">Environment</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Supabase URL:</span>
                  <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-400' : 'text-red-400'}>
                    {import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Supabase Key:</span>
                  <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-400' : 'text-red-400'}>
                    {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Logs */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-300">Recent Logs</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {logs.slice(-5).map((log, index) => (
                  <div key={index} className="text-xs">
                    <span className="text-gray-400">{log.timestamp}</span>
                    <span className={`ml-2 ${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warn' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-xs text-gray-500">No logs yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DebugPanel.displayName = 'DebugPanel';