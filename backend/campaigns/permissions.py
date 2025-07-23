# campaigns/permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission personnalisée pour permettre seulement aux propriétaires 
    de modifier leurs propres campagnes.
    """

    def has_object_permission(self, request, view, obj):
        # Permissions de lecture pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permissions d'écriture seulement pour le propriétaire de la campagne
        return obj.hr_manager == request.user


class IsCampaignOwner(permissions.BasePermission):
    """
    Permission pour s'assurer que l'utilisateur ne peut accéder 
    qu'à ses propres campagnes.
    """

    def has_permission(self, request, view):
        # L'utilisateur doit être authentifié
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # L'utilisateur ne peut accéder qu'à ses propres campagnes
        return obj.hr_manager == request.user
