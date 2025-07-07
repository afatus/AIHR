import React, { useState, useEffect, memo } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Server,
  Database,
  Mail,
  Bot,
  Video
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: string;
  icon: React.ComponentType<any>;
}

export const SystemHealth = memo(() => {
  console.log('SystemHealth render');
  
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      console.time('loadSystemHealth');
      // Mock data - in real app, this would call the health check API
      const mockServices: ServiceStatus[] = [
        {
          name: 'Database',
          status: 'healthy',
          responseTime: 45,
          lastCheck: new Date().toISOString(),
          icon: Database,
        },
        {
          name: 'SMTP Service',
          status: 'healthy',
          responseTime: 120,
          lastCheck: new Date().toISOString(),
          icon: Mail,
        },
        {
          name: 'OpenAI API',
          status: 'degraded',
          responseTime: 850,
          lastCheck: new Date().toISOString(),
          icon: Bot,
        },
        {
          name: 'Gemini API',
          status: 'healthy',
          responseTime: 340,
          lastCheck: new Date().toISOString(),
          icon: Bot,
        },
        {
          name: 'Video Service',
          status: 'healthy',
          responseTime: 220,
          lastCheck: new Date().toISOString(),
          icon: Video,
        },
      ];

      setServices(mockServices);
      setLastUpdate(new Date().toLocaleTimeString());
      console.timeEnd('loadSystemHealth');
    } catch (error) {
      console.error('Load system health error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Server className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'degraded':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'down':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const overallStatus = services.length > 0 ? 
    services.every(s => s.status === 'healthy') ? 'All Systems Operational' :
    services.some(s => s.status === 'down') ? 'System Issues Detected' :
    'Some Services Degraded' : 'Loading...';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate}
          </p>
        </div>
        <button
          onClick={loadSystemHealth}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="mb-6">
        <div className={`p-4 rounded-lg border ${getStatusColor(
          services.every(s => s.status === 'healthy') ? 'healthy' :
          services.some(s => s.status === 'down') ? 'down' : 'degraded'
        )}`}>
          <div className="flex items-center space-x-2">
            {getStatusIcon(
              services.every(s => s.status === 'healthy') ? 'healthy' :
              services.some(s => s.status === 'down') ? 'down' : 'degraded'
            )}
            <span className="font-medium">{overallStatus}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">
                    Response time: {service.responseTime}ms
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(service.status)}
                <span className={`text-sm font-medium capitalize ${
                  service.status === 'healthy' ? 'text-green-600' :
                  service.status === 'degraded' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {service.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SystemHealth.displayName = 'SystemHealth';