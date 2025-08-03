/**
 * Global configuration for lazy loading across the application
 * Provides consistent settings and performance optimizations
 */

// Default configurations for different content types
export const LAZY_LOADING_CONFIGS = {
  // Campaign listings
  campaigns: {
    pageSize: 6,
    threshold: 200,
    rootMargin: '100px',
    batchSize: 3, // For API batching
    debounceMs: 300
  },

  // History pages
  history: {
    pageSize: 10,
    threshold: 300,
    rootMargin: '150px',
    batchSize: 5,
    debounceMs: 500
  },

  // Dashboard components
  dashboard: {
    pageSize: 4,
    threshold: 100,
    rootMargin: '50px',
    batchSize: 2,
    debounceMs: 200
  },

  // Employee listings
  employees: {
    pageSize: 12,
    threshold: 250,
    rootMargin: '100px',
    batchSize: 6,
    debounceMs: 400
  },

  // Evaluation listings
  evaluations: {
    pageSize: 8,
    threshold: 150,
    rootMargin: '75px',
    batchSize: 4,
    debounceMs: 300
  },

  // Search results
  search: {
    pageSize: 15,
    threshold: 200,
    rootMargin: '100px',
    batchSize: 5,
    debounceMs: 500
  },

  // Mobile optimized
  mobile: {
    pageSize: 5,
    threshold: 150,
    rootMargin: '75px',
    batchSize: 2,
    debounceMs: 400
  }
};

// Performance monitoring
export const PERFORMANCE_THRESHOLDS = {
  // Maximum time for initial load (ms)
  maxInitialLoadTime: 2000,
  
  // Maximum time for subsequent loads (ms)
  maxSubsequentLoadTime: 1000,
  
  // Maximum items to keep in memory
  maxItemsInMemory: 500,
  
  // Cleanup threshold (items)
  cleanupThreshold: 300
};

/**
 * Hook to get optimized lazy loading configuration
 */
export const useLazyLoadingConfig = (contentType = 'campaigns', customConfig = {}) => {
  // Get base configuration
  const baseConfig = LAZY_LOADING_CONFIGS[contentType] || LAZY_LOADING_CONFIGS.campaigns;
  
  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Apply mobile optimizations if needed
  const mobileOptimizations = isMobile ? {
    pageSize: Math.max(3, Math.floor(baseConfig.pageSize * 0.6)),
    threshold: Math.floor(baseConfig.threshold * 0.8),
    batchSize: Math.max(1, Math.floor(baseConfig.batchSize * 0.5))
  } : {};
  
  // Detect slow connection
  const isSlowConnection = typeof navigator !== 'undefined' && 
    navigator.connection && 
    (navigator.connection.effectiveType === 'slow-2g' || 
     navigator.connection.effectiveType === '2g');
  
  // Apply slow connection optimizations
  const connectionOptimizations = isSlowConnection ? {
    pageSize: Math.max(2, Math.floor(baseConfig.pageSize * 0.4)),
    threshold: Math.floor(baseConfig.threshold * 1.5),
    debounceMs: baseConfig.debounceMs * 2
  } : {};
  
  // Merge all configurations
  const finalConfig = {
    ...baseConfig,
    ...mobileOptimizations,
    ...connectionOptimizations,
    ...customConfig
  };
  
  return {
    config: finalConfig,
    isMobile,
    isSlowConnection,
    // Helper functions
    shouldUseVirtualScrolling: finalConfig.pageSize > 20,
    shouldPreloadNext: !isSlowConnection && !isMobile,
    shouldUseImageLazyLoading: true,
    shouldUseSkeleton: true
  };
};

/**
 * Performance monitoring utilities
 */
export const usePerformanceMonitoring = () => {
  const startTime = performance.now();
  
  const measureLoadTime = (label = 'Load') => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > PERFORMANCE_THRESHOLDS.maxInitialLoadTime) {
      console.warn(`${label} took ${duration.toFixed(2)}ms - consider optimization`);
    }
    
    return duration;
  };
  
  const logPerformanceMetrics = (metrics) => {
    if (process.env.NODE_ENV === 'development') {
      const cacheHitRate = metrics.totalRequests > 0
        ? ((metrics.cacheHits || 0) / metrics.totalRequests * 100).toFixed(1)
        : '0.0';

      console.group('🚀 Lazy Loading Performance');
      console.log('Load Time:', `${metrics.loadTime?.toFixed(2)}ms`);
      console.log('Items Loaded:', metrics.itemsLoaded || 0);
      console.log('Cache Hit Rate:', `${cacheHitRate}%`);
      console.log('Memory Usage:', `${metrics.itemsInMemory || 0} items`);
      console.log('Page Number:', metrics.pageNumber || 1);
      console.log('Content Type:', metrics.contentType || 'unknown');

      // Performance warnings
      if (metrics.loadTime > 2000) {
        console.warn('⚠️ Slow loading detected - consider optimization');
      }
      if (metrics.itemsInMemory > 100) {
        console.warn('⚠️ High memory usage - consider cleanup');
      }

      console.groupEnd();
    }
  };
  
  return {
    measureLoadTime,
    logPerformanceMetrics
  };
};

/**
 * Memory management utilities
 */
export const useMemoryManagement = (maxItems = PERFORMANCE_THRESHOLDS.maxItemsInMemory) => {
  const shouldCleanup = (currentItems) => {
    return currentItems.length > PERFORMANCE_THRESHOLDS.cleanupThreshold;
  };
  
  const cleanupOldItems = (items, keepRecent = 100) => {
    if (items.length <= maxItems) return items;
    
    // Keep the most recent items
    return items.slice(-keepRecent);
  };
  
  const estimateMemoryUsage = (items) => {
    // Rough estimation of memory usage
    const avgItemSize = 1024; // 1KB per item estimate
    return items.length * avgItemSize;
  };
  
  return {
    shouldCleanup,
    cleanupOldItems,
    estimateMemoryUsage
  };
};

/**
 * Adaptive loading strategy
 */
export const useAdaptiveLoading = (contentType) => {
  const { config, isMobile, isSlowConnection } = useLazyLoadingConfig(contentType);
  
  // Adjust strategy based on conditions
  const getLoadingStrategy = () => {
    if (isSlowConnection) {
      return {
        strategy: 'conservative',
        preloadNext: false,
        useImagePlaceholders: true,
        prioritizeText: true
      };
    }
    
    if (isMobile) {
      return {
        strategy: 'mobile-optimized',
        preloadNext: true,
        useImagePlaceholders: true,
        prioritizeText: false
      };
    }
    
    return {
      strategy: 'aggressive',
      preloadNext: true,
      useImagePlaceholders: false,
      prioritizeText: false
    };
  };
  
  return {
    ...config,
    ...getLoadingStrategy()
  };
};

export default useLazyLoadingConfig;
