/**
 * Simple in-memory cache service for API responses
 * Helps reduce redundant API calls and improve performance
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);
    
    // Clean up expired entries periodically
    this.cleanup();
  }

  /**
   * Get cache entry if not expired
   */
  get(key) {
    const timestamp = this.timestamps.get(key);
    
    if (!timestamp || Date.now() > timestamp) {
      // Expired or doesn't exist
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now > timestamp) {
        this.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Cached API call wrapper
   */
  async cachedCall(key, apiCall, ttl = this.defaultTTL) {
    // Check cache first
    const cached = this.get(key);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Make API call
    try {
      const result = await apiCall();
      
      // Cache successful results
      if (result && result.success !== false) {
        this.set(key, result, ttl);
      }
      
      return { ...result, fromCache: false };
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

/**
 * Cache configurations for different types of data
 */
export const CACHE_CONFIGS = {
  campaigns: {
    ttl: 2 * 60 * 1000, // 2 minutes for campaigns
    key: 'campaigns'
  },
  
  workflow: {
    ttl: 5 * 60 * 1000, // 5 minutes for workflow status
    key: 'workflow'
  },
  
  dashboard: {
    ttl: 1 * 60 * 1000, // 1 minute for dashboard data
    key: 'dashboard'
  },
  
  history: {
    ttl: 10 * 60 * 1000, // 10 minutes for history
    key: 'history'
  }
};

/**
 * Helper function to create cached API calls
 */
export const createCachedCall = (endpoint, params, apiCall, cacheConfig = CACHE_CONFIGS.campaigns) => {
  const key = cacheService.generateKey(`${cacheConfig.key}:${endpoint}`, params);
  return cacheService.cachedCall(key, apiCall, cacheConfig.ttl);
};

/**
 * Hook for cache management
 */
export const useCache = () => {
  const clearCache = (pattern) => {
    if (pattern) {
      const keys = Array.from(cacheService.cache.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cacheService.delete(key);
        }
      });
    } else {
      cacheService.clear();
    }
  };

  const getCacheStats = () => cacheService.getStats();

  const invalidateCache = (keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => cacheService.delete(key));
    } else {
      cacheService.delete(keys);
    }
  };

  return {
    clearCache,
    getCacheStats,
    invalidateCache
  };
};

export default cacheService;
