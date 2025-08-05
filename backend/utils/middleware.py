import time
import logging
from django.db import connection
from django.conf import settings

logger = logging.getLogger(__name__)

class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Code à exécuter avant la vue
        start_time = time.time()
        sql_queries_start = len(connection.queries)

        response = self.get_response(request)

        # Code à exécuter après la vue
        duration = time.time() - start_time
        sql_queries = len(connection.queries) - sql_queries_start

        # Log uniquement les requêtes lentes (> 1 seconde)
        if duration > 1:
            logger.warning(
                f'Slow request: {request.path} took {duration:.2f}s with {sql_queries} queries',
                extra={
                    'path': request.path,
                    'method': request.method,
                    'duration': duration,
                    'sql_queries': sql_queries,
                }
            )
        else:
            logger.info(
                f'Request to {request.path} took {duration:.2f}s with {sql_queries} queries',
                extra={
                    'path': request.path,
                    'method': request.method,
                    'duration': duration,
                    'sql_queries': sql_queries,
                }
            )

        return response
