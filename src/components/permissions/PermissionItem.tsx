import React, { memo } from 'react';
import { Check, X } from 'lucide-react';

interface PermissionItemProps {
  permissionKey: string;
  label: string;
  description: string;
  enabled: boolean;
  limitCount: number;
  hasLimit: boolean;
  onToggle: (enabled: boolean) => void;
  onLimitChange: (limit: number) => void;
}

export const PermissionItem = memo<PermissionItemProps>(({
  permissionKey,
  label,
  description,
  enabled,
  limitCount,
  hasLimit,
  onToggle,
  onLimitChange,
}) => {
  console.log(`PermissionItem render: ${permissionKey}`);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${enabled ? 'bg-green-50' : 'bg-gray-50'}`}>
              {enabled ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{label}</h4>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasLimit && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Limit:</span>
              <input
                type="number"
                value={limitCount}
                onChange={(e) => onLimitChange(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
          )}
          
          <button
            onClick={() => onToggle(!enabled)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              enabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
    </div>
  );
});

PermissionItem.displayName = 'PermissionItem';