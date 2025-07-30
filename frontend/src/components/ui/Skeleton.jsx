import React from 'react';

// Base Skeleton component with Canvas-like shimmer effect
const Skeleton = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  animate = true
}) => {
  return (
    <div
      className={`
        ${width} ${height} ${rounded}
        relative overflow-hidden
        bg-warmGray-200
        ${className}
      `}
    >
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      )}
    </div>
  );
};

// Skeleton for text lines
export const SkeletonText = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          width={index === lines - 1 ? 'w-3/4' : 'w-full'}
          height="h-4"
        />
      ))}
    </div>
  );
};

// Skeleton for titles
export const SkeletonTitle = ({ size = 'large', className = '' }) => {
  const sizeClasses = {
    small: 'h-5 w-32',
    medium: 'h-6 w-48',
    large: 'h-8 w-64',
    xl: 'h-10 w-80'
  };

  return (
    <Skeleton 
      className={className}
      width={sizeClasses[size].split(' ')[1]}
      height={sizeClasses[size].split(' ')[0]}
      rounded="rounded-lg"
    />
  );
};

// Skeleton for avatars/circles
export const SkeletonAvatar = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <Skeleton 
      className={className}
      width={sizeClasses[size]}
      height={sizeClasses[size]}
      rounded="rounded-full"
    />
  );
};

// Skeleton for buttons
export const SkeletonButton = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-8 w-20',
    medium: 'h-10 w-24',
    large: 'h-12 w-32'
  };

  return (
    <Skeleton 
      className={className}
      width={sizeClasses[size].split(' ')[1]}
      height={sizeClasses[size].split(' ')[0]}
      rounded="rounded-lg"
    />
  );
};

// Skeleton for cards
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-warmGray-200 p-6 shadow-sm ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton width="w-48" height="h-6" rounded="rounded-md" />
            <Skeleton width="w-32" height="h-4" rounded="rounded-md" />
          </div>
          <Skeleton width="w-20" height="h-6" rounded="rounded-full" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <Skeleton width="w-full" height="h-4" rounded="rounded-md" />
          <Skeleton width="w-5/6" height="h-4" rounded="rounded-md" />
          <Skeleton width="w-4/6" height="h-4" rounded="rounded-md" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-warmGray-100">
          <div className="flex items-center space-x-3">
            <Skeleton width="w-5" height="h-5" rounded="rounded" />
            <Skeleton width="w-24" height="h-4" rounded="rounded-md" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton width="w-5" height="h-5" rounded="rounded" />
            <Skeleton width="w-20" height="h-4" rounded="rounded-md" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton width="w-5" height="h-5" rounded="rounded" />
            <Skeleton width="w-16" height="h-4" rounded="rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for evaluation cards
export const SkeletonEvaluationCard = ({ className = '' }) => {
  return (
    <div className={`bg-warmGray-50 border border-warmGray-200 rounded-xl p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header with name and date */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <SkeletonTitle size="small" />
            <Skeleton width="w-32" height="h-3" />
          </div>
          <Skeleton width="w-16" height="h-3" />
        </div>
        
        {/* Stars */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} width="w-4" height="h-4" rounded="rounded-sm" />
          ))}
          <Skeleton width="w-12" height="h-4" className="ml-2" />
        </div>
        
        {/* Comment */}
        <div className="bg-white rounded-lg p-4 border border-warmGray-200">
          <SkeletonText lines={3} />
        </div>
      </div>
    </div>
  );
};

// Skeleton for stats
export const SkeletonStats = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-warmGray-200 p-4 ${className}`}>
      <div className="flex items-center justify-center space-x-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center space-y-2">
            <Skeleton width="w-12" height="h-8" className="mx-auto" />
            <Skeleton width="w-16" height="h-3" className="mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton for workflow steps
export const SkeletonWorkflow = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step Navigation Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-warmGray-100 p-4">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center space-y-2">
              <SkeletonAvatar size="medium" />
              <Skeleton width="w-16" height="h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-warmGray-100 p-8">
        <div className="text-center space-y-6">
          <SkeletonAvatar size="large" className="mx-auto" />
          <SkeletonTitle size="large" className="mx-auto" />
          <SkeletonText lines={2} className="max-w-md mx-auto" />
          <SkeletonButton size="large" className="mx-auto" />
        </div>
      </div>
    </div>
  );
};

// Skeleton for dashboard
export const SkeletonDashboard = ({ className = '' }) => {
  return (
    <div className={`min-h-screen bg-cream p-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <SkeletonTitle size="xl" />
          <Skeleton width="w-32" height="h-8" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl border border-warmGray-200 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SkeletonAvatar size="medium" />
                  <Skeleton width="w-8" height="h-8" />
                </div>
                <div>
                  <Skeleton width="w-16" height="h-8" />
                  <Skeleton width="w-24" height="h-4" className="mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-6">
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for pair generation
export const SkeletonPairGeneration = ({ className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-warmGray-200 p-8 shadow-md">
          <div className="text-center space-y-6">
            <SkeletonAvatar size="large" className="mx-auto" />
            <SkeletonTitle size="large" className="mx-auto" />
            <SkeletonText lines={2} className="max-w-md mx-auto" />
            <SkeletonButton size="large" className="mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
