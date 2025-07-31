import React from 'react';

// Base Skeleton component with modern shimmer effect
const Skeleton = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  animate = true,
  variant = 'default',
  delay = 0
}) => {
  const variants = {
    default: 'bg-gradient-to-r from-warmGray-100/60 via-warmGray-200/40 to-warmGray-100/60',
    light: 'bg-gradient-to-r from-warmGray-50/70 via-warmGray-100/50 to-warmGray-50/70',
    card: 'bg-gradient-to-r from-white/70 via-warmGray-50/60 to-white/70 backdrop-blur-sm',
    text: 'bg-gradient-to-r from-warmGray-100/50 via-warmGray-200/40 to-warmGray-100/50',
    pulse: 'bg-gradient-to-r from-peach-100/30 via-peach-200/50 to-peach-100/30'
  };

  const animationStyle = delay > 0 ? { animationDelay: `${delay}ms` } : {};

  return (
    <div
      className={`
        ${width} ${height} ${rounded}
        relative overflow-hidden
        ${variants[variant]}
        border border-warmGray-100/20
        ${animate ? 'animate-pulse' : ''}
        transition-all duration-300
        ${className}
      `}
      style={animationStyle}
    >
      {animate && (
        <>
          {/* Primary shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          {/* Subtle highlight */}
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/20 via-transparent to-white/10" />
        </>
      )}
    </div>
  );
};

// Skeleton for text lines with realistic proportions
export const SkeletonText = ({ lines = 1, className = '', variant = 'text' }) => {
  const getLineWidth = (index, total) => {
    if (total === 1) return 'w-full';
    if (index === total - 1) return 'w-3/4'; // Last line shorter
    if (index === 0) return 'w-full'; // First line full
    return Math.random() > 0.5 ? 'w-full' : 'w-5/6'; // Random variation
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          width={getLineWidth(index, lines)}
          height="h-4"
          rounded="rounded-md"
          variant={variant}
        />
      ))}
    </div>
  );
};

// Skeleton for titles with better proportions
export const SkeletonTitle = ({ size = 'large', className = '', variant = 'default' }) => {
  const sizeClasses = {
    small: { height: 'h-5', width: 'w-32' },
    medium: { height: 'h-6', width: 'w-48' },
    large: { height: 'h-8', width: 'w-64' },
    xl: { height: 'h-10', width: 'w-80' }
  };

  return (
    <Skeleton 
      className={className}
      width={sizeClasses[size].width}
      height={sizeClasses[size].height}
      rounded="rounded-lg"
      variant={variant}
    />
  );
};

// Skeleton for avatars/circles with subtle glow
export const SkeletonAvatar = ({ size = 'medium', className = '', variant = 'default' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative ${className}`}>
      <Skeleton 
        width={sizeClasses[size]}
        height={sizeClasses[size]}
        rounded="rounded-full"
        variant={variant}
      />
      {/* Subtle ring effect for avatars */}
      <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full ring-2 ring-warmGray-200/30 animate-pulse`} />
    </div>
  );
};

// Skeleton for buttons with modern styling
export const SkeletonButton = ({ size = 'medium', className = '', variant = 'default' }) => {
  const sizeClasses = {
    small: { height: 'h-8', width: 'w-20' },
    medium: { height: 'h-10', width: 'w-24' },
    large: { height: 'h-12', width: 'w-32' }
  };

  return (
    <Skeleton 
      className={`shadow-sm ${className}`}
      width={sizeClasses[size].width}
      height={sizeClasses[size].height}
      rounded="rounded-lg"
      variant={variant}
    />
  );
};

// Enhanced Skeleton for cards with realistic layout
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white/70 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="space-y-6">
        {/* Header with staggered animation */}
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton width="w-48" height="h-6" rounded="rounded-md" variant="text" delay={100} />
            <Skeleton width="w-32" height="h-4" rounded="rounded-md" variant="light" delay={200} />
          </div>
          <div className="ml-4">
            <Skeleton width="w-20" height="h-6" rounded="rounded-full" variant="card" delay={300} />
          </div>
        </div>

        {/* Content with natural flow */}
        <div className="space-y-3">
          <Skeleton width="w-full" height="h-4" rounded="rounded-md" variant="text" delay={400} />
          <Skeleton width="w-5/6" height="h-4" rounded="rounded-md" variant="text" delay={500} />
          <Skeleton width="w-4/6" height="h-4" rounded="rounded-md" variant="text" delay={300} />
        </div>

        {/* Stats with icons */}
        <div className="flex items-center justify-between pt-4 border-t border-warmGray-100/50">
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="small" variant="light" />
            <Skeleton width="w-24" height="h-4" rounded="rounded-md" variant="light" delay={100} />
          </div>
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="small" variant="light" />
            <Skeleton width="w-20" height="h-4" rounded="rounded-md" variant="light" delay={200} />
          </div>
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="small" variant="light" />
            <Skeleton width="w-16" height="h-4" rounded="rounded-md" variant="light" delay={300} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Skeleton for evaluation cards
export const SkeletonEvaluationCard = ({ className = '' }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-warmGray-100/60 rounded-xl p-6 hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="space-y-5">
        {/* Header with name and date */}
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton width="w-36" height="h-5" rounded="rounded-md" variant="text" />
            <Skeleton width="w-48" height="h-4" rounded="rounded-md" variant="light" />
          </div>
          <Skeleton width="w-20" height="h-3" rounded="rounded-md" variant="light" />
        </div>

        {/* Stars with glow effect */}
        <div className="flex items-center space-x-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="relative">
              <Skeleton width="w-5" height="h-5" rounded="rounded-sm" variant="card" />
              <div className="absolute inset-0 w-5 h-5 rounded-sm bg-peach-200/20 animate-pulse" />
            </div>
          ))}
          <div className="ml-3">
            <Skeleton width="w-16" height="h-4" rounded="rounded-md" variant="light" />
          </div>
        </div>

        {/* Comment with realistic text simulation */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-warmGray-100/40">
          <div className="space-y-3">
            <Skeleton width="w-full" height="h-4" rounded="rounded-md" variant="text" />
            <Skeleton width="w-11/12" height="h-4" rounded="rounded-md" variant="text" />
            <Skeleton width="w-4/5" height="h-4" rounded="rounded-md" variant="text" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Skeleton for stats with modern styling
export const SkeletonStats = ({ className = '' }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg border border-warmGray-100/50 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-center space-x-12">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <SkeletonAvatar size="medium" variant="card" />
              {index === 1 && (
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <div key={starIndex} className="relative">
                      <Skeleton width="w-4" height="h-4" rounded="rounded-sm" variant="card" />
                      <div className="absolute inset-0 w-4 h-4 rounded-sm bg-peach-200/30 animate-pulse" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Skeleton width="w-20" height="h-4" rounded="rounded-md" variant="light" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Skeleton for workflow steps
export const SkeletonWorkflow = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step Navigation with progress simulation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-warmGray-100/50 p-6">
        <div className="relative">
          {/* Animated progress line */}
          <div className="absolute top-6 left-6 right-6 h-1 bg-warmGray-100/60 rounded-full"></div>
          <div className="absolute top-6 left-6 h-1 bg-gradient-to-r from-peach-300/60 to-peach-400/40 rounded-full animate-pulse" style={{ width: '40%' }}></div>

          {/* Enhanced steps */}
          <div className="relative flex justify-between">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div key={step} className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <SkeletonAvatar size="medium" variant={index < 2 ? 'card' : 'light'} />
                  {index < 2 && (
                    <div className="absolute inset-0 w-12 h-12 rounded-full bg-peach-200/20 animate-pulse" />
                  )}
                </div>
                <Skeleton width="w-16" height="h-4" rounded="rounded-md" variant="light" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content with centerpiece */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-warmGray-100/50 p-8">
        <div className="text-center space-y-8">
          <div className="relative mx-auto">
            <SkeletonAvatar size="xl" variant="card" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-peach-200/30 to-peach-300/20 animate-pulse" />
          </div>
          <div className="space-y-4">
            <Skeleton width="w-80" height="h-8" rounded="rounded-lg" variant="text" className="mx-auto" />
            <Skeleton width="w-96" height="h-5" rounded="rounded-md" variant="light" className="mx-auto" />
            <Skeleton width="w-64" height="h-5" rounded="rounded-md" variant="light" className="mx-auto" />
          </div>
          <div className="flex justify-center space-x-4 pt-6">
            <SkeletonButton size="medium" variant="light" />
            <SkeletonButton size="large" variant="card" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Skeleton for dashboard
export const SkeletonDashboard = ({ className = '' }) => {
  return (
    <div className={`min-h-screen bg-cream p-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with better proportions */}
        <div className="flex items-center justify-between">
          <SkeletonTitle size="xl" variant="text" />
          <SkeletonButton size="medium" variant="card" />
        </div>

        {/* Enhanced stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SkeletonAvatar size="medium" variant="card" />
                  <SkeletonAvatar size="small" variant="light" />
                </div>
                <div className="space-y-2">
                  <Skeleton width="w-16" height="h-8" rounded="rounded-md" variant="text" />
                  <Skeleton width="w-24" height="h-4" rounded="rounded-md" variant="light" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content with enhanced cards */}
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

// Enhanced Skeleton for pair generation
export const SkeletonPairGeneration = ({ className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-8 shadow-lg">
          <div className="text-center space-y-8">
            <div className="relative mx-auto">
              <SkeletonAvatar size="xl" variant="card" />
              <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-br from-peach-200/40 to-peach-300/20 animate-pulse" />
            </div>
            <div className="space-y-4">
              <SkeletonTitle size="large" variant="text" className="mx-auto" />
              <SkeletonText lines={2} variant="light" className="max-w-md mx-auto" />
            </div>
            <SkeletonButton size="large" variant="card" className="mx-auto shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Skeleton for campaign history page
export const SkeletonCampaignHistory = ({ className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Enhanced header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SkeletonAvatar size="small" variant="light" />
            <Skeleton width="w-36" height="h-5" rounded="rounded-md" variant="text" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <SkeletonAvatar size="small" variant="card" />
              <Skeleton width="w-32" height="h-5" rounded="rounded-md" variant="light" />
            </div>
            <SkeletonButton size="medium" variant="card" />
          </div>
        </div>

        {/* Enhanced campaign info card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-8 shadow-sm">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Skeleton width="w-64" height="h-8" rounded="rounded-lg" variant="text" className="mx-auto" />
              <Skeleton width="w-96" height="h-5" rounded="rounded-md" variant="light" className="mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center space-y-3">
                  <SkeletonAvatar size="medium" variant="card" className="mx-auto" />
                  <Skeleton width="w-20" height="h-4" rounded="rounded-md" variant="light" className="mx-auto" />
                  <Skeleton width="w-24" height="h-6" rounded="rounded-md" variant="text" className="mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced workflow summary card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-warmGray-100/50 p-8 shadow-sm">
          <div className="space-y-6">
            <Skeleton width="w-48" height="h-6" rounded="rounded-md" variant="text" />

            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-warmGray-50/60 backdrop-blur-sm rounded-lg border border-warmGray-100/30">
                  <SkeletonAvatar size="small" variant="card" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="w-32" height="h-5" rounded="rounded-md" variant="text" />
                    <Skeleton width="w-48" height="h-4" rounded="rounded-md" variant="light" />
                  </div>
                  <SkeletonAvatar size="small" variant="light" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Skeleton };
export default Skeleton;
