import { useState, useEffect, useCallback } from 'react';

const useInfiniteScroll = (fetchMore, hasMore) => {
  const [loading, setLoading] = useState(false);

  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // Trigger when user is 200px from bottom
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      setLoading(true);
      fetchMore().finally(() => setLoading(false));
    }
  }, [loading, hasMore, fetchMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { loading };
};

export default useInfiniteScroll;
