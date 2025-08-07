import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * Unified lazy loading container with consistent loading states
 */
const LazyLoadingContainer = ({
  children,
  loading,
  loadingMore,
  error,
  hasMore,
  isEmpty,
  isFirstLoad,
  onRetry,
  sentinelRef,
  emptyState = null,
  loadingState = null,
  errorState = null,
  loadMoreText = "Chargement...",
  endText = "Vous avez atteint la fin",
  className = "",
  showPerformanceInfo = false,
  performanceData = null
}) => {
  // Default empty state
  const defaultEmptyState = (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-2M4 9h2" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun élément trouvé</h3>
      <p className="text-gray-500">Il n'y a aucun élément à afficher pour le moment.</p>
    </div>
  );

  // Default loading state
  const defaultLoadingState = (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Default error state
  const defaultErrorState = (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Une erreur s'est produite</h3>
      <p className="text-gray-500 mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Réessayer
        </button>
      )}
    </div>
  );

  // Loading more indicator
  const LoadingMoreIndicator = () => (
    <div className="flex justify-center py-8">
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        <span className="text-sm font-medium">{loadMoreText}</span>
      </div>
    </div>
  );

  // End of list indicator
  const EndIndicator = () => (
    <div className="text-center py-8">
      <div className="inline-flex items-center space-x-2 text-gray-500 text-sm">
        <ChevronDownIcon className="h-4 w-4" />
        <span>{endText}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </div>
    </div>
  );

  // Sentinel element for intersection observer
  const Sentinel = () => (
    <div
      ref={sentinelRef}
      className="h-4 flex items-center justify-center"
      aria-hidden="true"
    >
      {/* Invisible sentinel for intersection observer */}
    </div>
  );

  // Performance info component
  const PerformanceInfo = () => {
    if (!showPerformanceInfo || !performanceData) return null;

    const cacheHitRate = performanceData.totalRequests > 0
      ? ((performanceData.cacheHits / performanceData.totalRequests) * 100).toFixed(1)
      : '0.0';

    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-700 font-medium mb-1">Performance Info</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-600">
          <div>
            <span className="font-medium">Items:</span> {performanceData.totalItems || 0}
          </div>
          <div>
            <span className="font-medium">Cache:</span> {cacheHitRate}%
          </div>
          <div>
            <span className="font-medium">Requests:</span> {performanceData.totalRequests || 0}
          </div>
          <div>
            <span className="font-medium">Memory:</span> {performanceData.itemsInMemory || 0}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`lazy-loading-container ${className}`}>
      {/* First load state */}
      {isFirstLoad && (loadingState || defaultLoadingState)}
      
      {/* Error state */}
      {error && !loading && (errorState || defaultErrorState)}
      
      {/* Empty state */}
      {isEmpty && !error && (emptyState || defaultEmptyState)}
      
      {/* Content */}
      {!isFirstLoad && !error && !isEmpty && (
        <>
          {children}
          
          {/* Loading more indicator */}
          {loadingMore && <LoadingMoreIndicator />}
          
          {/* End indicator */}
          {!hasMore && !loadingMore && <EndIndicator />}
          
          {/* Sentinel for intersection observer */}
          {hasMore && !loadingMore && <Sentinel />}

          {/* Performance info */}
          <PerformanceInfo />
        </>
      )}
    </div>
  );
};

/**
 * Grid variant for card layouts
 */
export const LazyLoadingGrid = ({
  children,
  columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  gap = 'gap-6',
  ...props
}) => {
  return (
    <LazyLoadingContainer {...props}>
      <div className={`grid ${columns} ${gap}`}>
        {children}
      </div>
    </LazyLoadingContainer>
  );
};

/**
 * List variant for linear layouts
 */
export const LazyLoadingList = ({
  children,
  spacing = 'space-y-4',
  ...props
}) => {
  return (
    <LazyLoadingContainer {...props}>
      <div className={spacing}>
        {children}
      </div>
    </LazyLoadingContainer>
  );
};

export default LazyLoadingContainer;
