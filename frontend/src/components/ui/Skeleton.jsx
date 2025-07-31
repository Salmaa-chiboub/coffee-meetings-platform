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
    <div className={`bg-warmGray-50 border border-warmGray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="space-y-5">
        {/* Header with name and date */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton width="w-36" height="h-5" rounded="rounded-md" />
            <Skeleton width="w-48" height="h-4" rounded="rounded-md" />
          </div>
          <Skeleton width="w-20" height="h-3" rounded="rounded-md" />
        </div>

        {/* Stars */}
        <div className="flex items-center space-x-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} width="w-5" height="h-5" rounded="rounded-sm" />
          ))}
          <Skeleton width="w-16" height="h-4" rounded="rounded-md" className="ml-3" />
        </div>

        {/* Comment */}
        <div className="bg-white rounded-lg p-4 border border-warmGray-200">
          <div className="space-y-2">
            <Skeleton width="w-full" height="h-4" rounded="rounded-md" />
            <Skeleton width="w-11/12" height="h-4" rounded="rounded-md" />
            <Skeleton width="w-4/5" height="h-4" rounded="rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for stats
export const SkeletonStats = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-warmGray-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-center space-x-12">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Skeleton width="w-8" height="h-8" rounded="rounded-md" className="mx-auto" />
              {index === 1 && (
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Skeleton key={starIndex} width="w-4" height="h-4" rounded="rounded-sm" />
                  ))}
                </div>
              )}
            </div>
            <Skeleton width="w-20" height="h-4" rounded="rounded-md" className="mx-auto" />
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
      <div className="bg-white rounded-xl shadow-sm border border-warmGray-100 p-6">
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-warmGray-200 rounded-full"></div>
          <div className="absolute top-6 left-6 h-1 bg-warmGray-300 rounded-full" style={{ width: '40%' }}></div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-col items-center space-y-3">
                <Skeleton width="w-12" height="h-12" rounded="rounded-full" />
                <Skeleton width="w-16" height="h-4" rounded="rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-warmGray-100 p-8">
        <div className="text-center space-y-8">
          <Skeleton width="w-20" height="h-20" rounded="rounded-full" className="mx-auto" />
          <div className="space-y-4">
            <Skeleton width="w-80" height="h-8" rounded="rounded-md" className="mx-auto" />
            <Skeleton width="w-96" height="h-5" rounded="rounded-md" className="mx-auto" />
            <Skeleton width="w-64" height="h-5" rounded="rounded-md" className="mx-auto" />
          </div>
          <div className="flex justify-center space-x-4 pt-6">
            <Skeleton width="w-24" height="h-10" rounded="rounded-lg" />
            <Skeleton width="w-32" height="h-10" rounded="rounded-lg" />
          </div>
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

// Skeleton for campaign history page
export const SkeletonCampaignHistory = ({ className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton width="w-5" height="h-5" rounded="rounded" />
            <Skeleton width="w-36" height="h-5" rounded="rounded-md" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
              <Skeleton width="w-32" height="h-5" rounded="rounded-md" />
            </div>
            <Skeleton width="w-32" height="h-10" rounded="rounded-lg" />
          </div>
        </div>

        {/* Campaign Info Card */}
        <div className="bg-white rounded-xl border border-warmGray-200 p-8 shadow-sm">
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <Skeleton width="w-64" height="h-8" rounded="rounded-md" className="mx-auto" />
              <Skeleton width="w-96" height="h-5" rounded="rounded-md" className="mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center space-y-3">
                  <Skeleton width="w-12" height="h-12" rounded="rounded-full" className="mx-auto" />
                  <Skeleton width="w-20" height="h-4" rounded="rounded-md" className="mx-auto" />
                  <Skeleton width="w-24" height="h-6" rounded="rounded-md" className="mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Summary Card */}
        <div className="bg-white rounded-xl border border-warmGray-200 p-8 shadow-sm">
          <div className="space-y-6">
            <Skeleton width="w-48" height="h-6" rounded="rounded-md" />

            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-warmGray-50 rounded-lg">
                  <Skeleton width="w-10" height="h-10" rounded="rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="w-32" height="h-5" rounded="rounded-md" />
                    <Skeleton width="w-48" height="h-4" rounded="rounded-md" />
                  </div>
                  <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
