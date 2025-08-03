import { useState, useEffect, useCallback, useRef } from 'react';
import { useLazyLoadingConfig, usePerformanceMonitoring, useMemoryManagement } from './useLazyLoadingConfig';

/**
 * Unified lazy loading hook for consistent implementation across the app
 * Combines viewport detection, infinite scroll, and batch loading with performance optimization
 */
const useLazyLoading = ({
  fetchData,
  initialData = [],
  contentType = 'campaigns', // Type of content for optimized config
  pageSize: customPageSize,
  threshold: customThreshold,
  rootMargin: customRootMargin,
  enabled = true,
  resetTrigger = null, // Dependency to reset the data
  customConfig = {}
}) => {
  // Get optimized configuration
  const { config } = useLazyLoadingConfig(contentType, {
    pageSize: customPageSize,
    threshold: customThreshold,
    rootMargin: customRootMargin,
    ...customConfig
  });

  const { pageSize, threshold, rootMargin } = config;

  // Performance monitoring
  const { measureLoadTime, logPerformanceMetrics } = usePerformanceMonitoring();

  // Memory management
  const { shouldCleanup, cleanupOldItems } = useMemoryManagement();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [cacheHits, setCacheHits] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Reset data when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== null && !isInitialLoad.current) {
      setData([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      isInitialLoad.current = true;
    }
  }, [resetTrigger]);

  // Load data function with performance monitoring
  const loadData = useCallback(async (pageNum, isLoadMore = false) => {
    if (!enabled || loading || (isLoadMore && !hasMore)) return;

    const startTime = performance.now();

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await fetchData(pageNum, pageSize);

      // Track cache statistics
      setTotalRequests(prev => prev + 1);
      if (result?.fromCache) {
        setCacheHits(prev => prev + 1);
      }

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Lazy loading result:', result);
      }

      if (result && result.success) {
        const newData = result.data || [];
        const pagination = result.pagination;

        if (isLoadMore) {
          setData(prevData => {
            const newCombinedData = [...prevData, ...newData];

            // Apply memory management
            if (shouldCleanup(newCombinedData)) {
              return cleanupOldItems(newCombinedData, pageSize * 5);
            }

            return newCombinedData;
          });
        } else {
          setData(newData);
        }

        // Update pagination state
        if (pagination) {
          setHasMore(pagination.has_next || false);
        } else {
          // Fallback: assume no more data if we got less than pageSize
          setHasMore(newData.length === pageSize);
        }

        setPage(pageNum);

        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          const loadTime = performance.now() - startTime;
          logPerformanceMetrics({
            loadTime,
            itemsLoaded: newData.length,
            itemsInMemory: data.length + newData.length,
            totalRequests,
            cacheHits,
            pageNumber: pageNum,
            contentType
          });
        }
      } else {
        const errorMessage = result?.error || 'Failed to load data - invalid response format';
        console.error('Lazy loading failed:', { result, errorMessage });
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Lazy loading error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        pageNum,
        pageSize,
        contentType
      });
      setError(err.message || 'Failed to load data');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isInitialLoad.current = false;
    }
  }, [fetchData, pageSize, enabled, loading, hasMore, shouldCleanup, cleanupOldItems, logPerformanceMetrics, data.length, contentType]);

  // Load more data
  const loadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      loadData(page + 1, true);
    }
  }, [loadData, page, hasMore, loading, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    observer.observe(sentinelRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loading, loadingMore, enabled, rootMargin]);

  // Scroll-based fallback for infinite scroll
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;

      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, loading, loadingMore, hasMore, threshold, enabled]);

  // Initial load
  useEffect(() => {
    if (enabled && isInitialLoad.current) {
      loadData(1, false);
    }
  }, [enabled]); // Only depend on enabled to avoid infinite loops

  // Refresh function
  const refresh = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setCacheHits(0);
    setTotalRequests(0);
    isInitialLoad.current = true;
    loadData(1, false);
  }, [loadData]);

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    sentinelRef, // Ref for the sentinel element
    // Utility functions
    isEmpty: data.length === 0 && !loading,
    isFirstLoad: loading && data.length === 0,
    totalItems: data.length,
    // Performance metrics
    cacheHits,
    totalRequests
  };
};

export default useLazyLoading;
