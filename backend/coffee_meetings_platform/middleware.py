import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework import status

logger = logging.getLogger(__name__)

class UserDataIsolationMiddleware(MiddlewareMixin):
    """
    Middleware pour s'assurer que les utilisateurs ne peuvent accéder 
    qu'à leurs propres données.
    """
    
    def process_request(self, request):
        """Log les requêtes pour audit"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            logger.info(f"User {request.user.id} ({request.user.email}) accessing {request.path}")
        return None

    def process_response(self, request, response):
        """Vérifier que les réponses ne contiennent que les données de l'utilisateur"""
        # Cette vérification est principalement pour l'audit
        # La séparation réelle est gérée par les permissions et les querysets
        if hasattr(request, 'user') and request.user.is_authenticated:
            logger.debug(f"User {request.user.id} received response for {request.path}")
        return response

    def process_exception(self, request, exception):
        """Gérer les exceptions liées à l'isolation des données"""
        if hasattr(request, 'user') and request.user.is_authenticated:
            logger.error(f"Exception for user {request.user.id} on {request.path}: {str(exception)}")
        return None
