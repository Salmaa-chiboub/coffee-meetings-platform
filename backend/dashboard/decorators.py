from functools import wraps
from django.core.cache import cache
import json
from rest_framework.response import Response

def cache_dashboard_response(timeout=300):
    """
    Décorateur spécialisé pour la mise en cache des réponses du dashboard
    qui gère correctement la sérialisation des réponses DRF
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Générer une clé de cache unique basée sur l'utilisateur et les paramètres
            cache_key = f"dashboard_{view_func.__name__}_{request.user.id}_{request.GET.urlencode()}"
            
            # Tenter de récupérer depuis le cache
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(json.loads(cached_data))
            
            # Exécuter la vue si pas en cache
            response = view_func(request, *args, **kwargs)
            
            # Mettre en cache uniquement les réponses réussies
            if response.status_code == 200:
                try:
                    # Sérialiser la réponse pour le cache
                    cache_data = json.dumps(response.data)
                    cache.set(cache_key, cache_data, timeout)
                except (TypeError, json.JSONDecodeError) as e:
                    # En cas d'erreur de sérialisation, on retourne quand même la réponse
                    # mais on ne met pas en cache
                    pass
                
            return response
            
        return wrapper
    return decorator
