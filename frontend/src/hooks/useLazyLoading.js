import { useState, useCallback, useRef } from 'react';

/**
 * Simple lazy loading hook
 */
const useLazyLoading = ({
  fetchData,
  initialData = [],
  enabled = true,
}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [cacheHits] = useState(0);
  const [totalRequests] = useState(0);
  
  const sentinelRef = useRef(null);

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

      const result = await fetchData(pageNum, 10);

      if (result && result.success) {
        const newData = result.data || [];

        if (isLoadMore) {
          setData(prevData => [...prevData, ...newData]);
        } else {
          setData(newData);
        }

        // Update pagination state
        setHasMore(newData.length === 10);
        setPage(pageNum);
      } else {
        throw new Error(result?.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Lazy loading error:', err);
      setError(err.message || 'Failed to load data');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchData, enabled, loading, hasMore]);

  // Load more data
  const loadMore = useCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      loadData(page + 1, true);
    }
  }, [loadData, page, hasMore, loading, loadingMore]);

  // Refresh function
  const refresh = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
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
    isEmpty: data.length === 0 && !loading,
    isFirstLoad: loading && data.length === 0,
    totalItems: data.length,
    cacheHits,
    totalRequests
  };
};

export default useLazyLoading;
