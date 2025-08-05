import React, { useCallback } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { dashboardService } from '../../services/dashboardService';
import { LazyLoadingList } from '../ui/LazyLoadingContainer';
import useLazyLoading from '../../hooks/useLazyLoading';

const RecentEvaluationsLazy = ({ initialLimit = 4 }) => {
  // Fetch function for lazy loading
  const fetchEvaluations = useCallback(async (page, pageSize) => {
    try {
      const response = await dashboardService.getRecentEvaluations(pageSize);
      
      if (response.success) {
        // Simulate pagination for recent evaluations
        const allData = response.data || [];
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = allData.slice(startIndex, endIndex);
        
        return {
          success: true,
          data: pageData,
          pagination: {
            current_page: page,
            page_size: pageSize,
            total_count: allData.length,
            has_next: endIndex < allData.length,
            has_previous: page > 1
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to fetch evaluations',
          data: [],
          pagination: { has_next: false, has_previous: false }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch evaluations',
        data: [],
        pagination: { has_next: false, has_previous: false }
      };
    }
  }, []);

  // Lazy loading hook
  const {
    data: evaluations,
    loading,
    loadingMore,
    error,
    hasMore,
    isEmpty,
    isFirstLoad,
    refresh,
    sentinelRef
  } = useLazyLoading({
    fetchData: fetchEvaluations,
    pageSize: initialLimit,
    threshold: 100
  });

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarOutlineIcon className="h-4 w-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <StarIcon className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarOutlineIcon key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }

    return stars;
  };

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
        <StarOutlineIcon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">No evaluations yet</h3>
      <p className="text-xs text-gray-500">Evaluations will appear here once submitted</p>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse bg-warmGray-50/70 rounded-lg p-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="col-span-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="col-span-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 w-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="col-span-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-warmGray-100/50">
      <h2 className="text-xl font-semibold text-warmGray-800 mb-6">Recent Evaluations</h2>
      
      <LazyLoadingList
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        hasMore={hasMore}
        isEmpty={isEmpty}
        isFirstLoad={isFirstLoad}
        onRetry={refresh}
        sentinelRef={sentinelRef}
        emptyState={<EmptyState />}
        loadingState={<LoadingSkeleton />}
        spacing="space-y-4"
        loadMoreText="Loading more evaluations..."
        endText="All recent evaluations loaded"
      >
        {evaluations.map((evaluation, index) => (
          <div 
            key={`${evaluation.id || index}`} 
            className="bg-warmGray-50/70 rounded-lg p-4 hover:bg-warmGray-100/70 transition-colors duration-200"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Left Section - Names */}
              <div className="col-span-3">
                <div className="text-sm font-medium text-warmGray-800">
                  {evaluation.evaluator_name || 'Anonymous'}
                </div>
                <div className="text-xs text-warmGray-500">
                  Evaluator
                </div>
              </div>

              {/* Middle Section - Evaluated Person */}
              <div className="col-span-3">
                <div className="text-sm font-medium text-warmGray-800">
                  {evaluation.evaluated_name || 'Anonymous'}
                </div>
                <div className="text-xs text-warmGray-500">
                  Evaluated
                </div>
              </div>

              {/* Rating */}
              <div className="col-span-2">
                <div className="flex items-center space-x-1">
                  {renderStars(evaluation.rating || 0)}
                </div>
              </div>

              {/* Campaign */}
              <div className="col-span-2">
                <div className="text-sm text-warmGray-700 truncate">
                  {evaluation.campaign_name || 'Unknown Campaign'}
                </div>
              </div>

              {/* Date */}
              <div className="col-span-2">
                <div className="text-xs text-warmGray-500">
                  {evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>

            {/* Comments if available */}
            {evaluation.comments && (
              <div className="mt-3 pt-3 border-t border-warmGray-200">
                <p className="text-sm text-warmGray-600 italic line-clamp-2">
                  "{evaluation.comments}"
                </p>
              </div>
            )}
          </div>
        ))}
      </LazyLoadingList>
    </div>
  );
};

export default RecentEvaluationsLazy;
