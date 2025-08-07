import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Simplified lazy loading hook
 */
const useLazyLoading = ({
  fetchData,
  initialData = [],
  contentType = 'campaigns',
  pageSize = 10,
  threshold = 200,
  rootMargin = '100px',
  enabled = true,
  resetTrigger = null,
}) => {
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

  // Load data function
  const loadData = useCallback(async (pageNum, isLoadMore = false) => {
    if (!enabled || loading || (isLoadMore && !hasMore)) return;

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

      if (result && result.success) {
        const newData = result.data || [];
        const pagination = result.pagination;

        if (isLoadMore) {
          setData(prevData => [...prevData, ...newData]);
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
      } else {
        const errorMessage = result?.error || 'Failed to load data';
        console.error('Lazy loading failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Lazy loading error:', err);
      setError(err.message || 'Failed to load data');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isInitialLoad.current = false;
    }
  }, [fetchData, pageSize, enabled, loading, hasMore]);

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

  // Initial load
  useEffect(() => {
    if (enabled && isInitialLoad.current) {
      loadData(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    sentinelRef,
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
