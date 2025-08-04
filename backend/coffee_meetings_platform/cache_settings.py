# Settings for cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.HiredisParser',
            'SOCKET_TIMEOUT': 5,
            'SOCKET_CONNECT_TIMEOUT': 5,
            'CONNECTION_POOL_CLASS': 'redis.BlockingConnectionPool',
            'CONNECTION_POOL_CLASS_KWARGS': {
                'max_connections': 50,
                'timeout': 20,
            },
            'MAX_CONNECTIONS': 1000,
            'RETRY_ON_TIMEOUT': True,
        },
        'KEY_PREFIX': 'coffee_meetings',
        'TIMEOUT': 300,  # 5 minutes default timeout
    }
}

# Cache middleware settings
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 300
CACHE_MIDDLEWARE_KEY_PREFIX = 'coffee_meetings_view'

# Cache configuration for specific views
CACHE_TIMEOUT = {
    'campaign_list': 300,        # 5 minutes
    'campaign_detail': 300,      # 5 minutes
    'workflow_status': 60,       # 1 minute
    'employee_list': 300,        # 5 minutes
    'matching_results': 300,     # 5 minutes
}

# Session cache configuration
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
