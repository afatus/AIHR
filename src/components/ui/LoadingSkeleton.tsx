import React, { memo } from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export const LoadingSkeleton = memo<LoadingSkeletonProps>(({ 
  rows = 5, 
  className = "bg-white rounded-xl p-6 shadow-sm border border-gray-200" 
}) => {
  return (
    <div className={className}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';