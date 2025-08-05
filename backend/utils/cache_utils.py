# utils/cache_utils.py
"""
Caching utilities for improved backend performance
"""
import time
import hashlib
import json
from functools import wraps
from typing import Any, Dict, Optional, Callable
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class PerformanceCache:
    """
    High-performance caching utility with automatic invalidation
    """
    
    def __init__(self, default_timeout: int = 300):
        self.default_timeout = default_timeout
        self.hit_count = 0
        self.miss_count = 0
    
    def get_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a consistent cache key"""
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items()) if kwargs else {}
        }
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{prefix}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache with hit/miss tracking"""
        value = cache.get(key)
        if value is not None:
            self.hit_count += 1
            logger.debug(f"Cache HIT for key: {key}")
        else:
            self.miss_count += 1
            logger.debug(f"Cache MISS for key: {key}")
        return value
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> None:
        """Set value in cache"""
        timeout = timeout or self.default_timeout
        cache.set(key, value, timeout)
        logger.debug(f"Cache SET for key: {key}, timeout: {timeout}s")
    
    def delete(self, key: str) -> None:
        """Delete value from cache"""
        cache.delete(key)
        logger.debug(f"Cache DELETE for key: {key}")
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache performance statistics"""
        total = self.hit_count + self.miss_count
        hit_rate = (self.hit_count / total * 100) if total > 0 else 0
        return {
            'hits': self.hit_count,
            'misses': self.miss_count,
            'total': total,
            'hit_rate': round(hit_rate, 2)
        }

# Global cache instance
performance_cache = PerformanceCache()

def cached_result(timeout=None, key_prefix=None):
    """Decorator for caching function results with DRF response handling"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Générer la clé de cache
            if callable(key_prefix):
                cache_key = key_prefix(*args, **kwargs)
            else:
                prefix = key_prefix or func.__name__
                cache_key = performance_cache.get_cache_key(prefix, *args, **kwargs)

            # Tenter de récupérer depuis le cache
            cached_value = performance_cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Exécuter la fonction si pas en cache
            result = func(*args, **kwargs)
            
            # Si c'est une Response DRF, la rendre avant la mise en cache
            if hasattr(result, 'render'):
                rendered_result = result.render()
                result._content = rendered_result  # Stocker le contenu rendu
            
            # Mettre en cache avec timeout
            cache_timeout = timeout or performance_cache.default_timeout
            performance_cache.set(cache_key, result, cache_timeout)
            
            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalidate cache keys matching a pattern
    Returns number of keys invalidated
    """
    try:
        # This is a simplified version - in production you might want to use Redis SCAN
        # For now, we'll use Django's cache framework limitations
        cache.clear()  # Clear all cache - not ideal but works for development
        logger.info(f"Cache cleared for pattern: {pattern}")
        return 1
    except Exception as e:
        logger.error(f"Error clearing cache pattern {pattern}: {e}")
        return 0


class QueryCache:
    """
    Specialized cache for database queries
    """
    
    @staticmethod
    def cache_queryset_result(queryset, cache_key: str, timeout: int = 300):
        """Cache queryset results"""
        try:
            # Convert queryset to list to evaluate it
            result = list(queryset)
            performance_cache.set(cache_key, result, timeout)
            return result
        except Exception as e:
            logger.error(f"Error caching queryset: {e}")
            return list(queryset)  # Return uncached result
    
    @staticmethod
    def get_cached_queryset(cache_key: str):
        """Get cached queryset result"""
        return performance_cache.get(cache_key)


# Campaign-specific cache utilities
class CampaignCache:
    """Cache utilities for campaign-related data"""
    
    @staticmethod
    def get_campaign_employees_key(campaign_id: int) -> str:
        return f"campaign_employees:{campaign_id}"
    
    @staticmethod
    def get_campaign_stats_key(campaign_id: int) -> str:
        return f"campaign_stats:{campaign_id}"
    
    @staticmethod
    def invalidate_campaign_cache(campaign_id: int) -> None:
        """Invalidate all cache for a specific campaign"""
        keys_to_delete = [
            CampaignCache.get_campaign_employees_key(campaign_id),
            CampaignCache.get_campaign_stats_key(campaign_id),
        ]
        
        for key in keys_to_delete:
            performance_cache.delete(key)
        
        logger.info(f"Invalidated cache for campaign {campaign_id}")


# Employee-specific cache utilities
class EmployeeCache:
    """Cache utilities for employee-related data"""
    
    @staticmethod
    def get_employee_attributes_key(employee_id: int) -> str:
        return f"employee_attributes:{employee_id}"
    
    @staticmethod
    def get_campaign_employees_attributes_key(campaign_id: int) -> str:
        return f"campaign_employees_attributes:{campaign_id}"
    
    @staticmethod
    def invalidate_employee_cache(employee_id: int) -> None:
        """Invalidate cache for a specific employee"""
        key = EmployeeCache.get_employee_attributes_key(employee_id)
        performance_cache.delete(key)
        logger.info(f"Invalidated cache for employee {employee_id}")


# Matching algorithm cache utilities
class MatchingCache:
    """Cache utilities for matching algorithm data"""
    
    @staticmethod
    def get_matching_criteria_key(campaign_id: int) -> str:
        return f"matching_criteria:{campaign_id}"
    
    @staticmethod
    def get_existing_pairs_key(campaign_id: int) -> str:
        return f"existing_pairs:{campaign_id}"
    
    @staticmethod
    def invalidate_matching_cache(campaign_id: int) -> None:
        """Invalidate matching cache for a campaign"""
        keys_to_delete = [
            MatchingCache.get_matching_criteria_key(campaign_id),
            MatchingCache.get_existing_pairs_key(campaign_id),
        ]
        
        for key in keys_to_delete:
            performance_cache.delete(key)
        
        logger.info(f"Invalidated matching cache for campaign {campaign_id}")


# Performance monitoring
class PerformanceMonitor:
    """Monitor and log performance metrics"""
    
    @staticmethod
    def log_query_performance(query_name: str, execution_time: float, result_count: int = 0):
        """Log query performance metrics"""
        logger.info(f"Query '{query_name}' executed in {execution_time:.3f}s, returned {result_count} results")
    
    @staticmethod
    def log_cache_performance():
        """Log cache performance statistics"""
        stats = performance_cache.get_stats()
        logger.info(f"Cache performance: {stats}")
