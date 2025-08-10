from rest_framework import permissions

class IsNotificationOwner(permissions.BasePermission):
    """
    Permission pour s'assurer que l'utilisateur ne peut accéder 
    qu'à ses propres notifications.
    """

    def has_permission(self, request, view):
        # L'utilisateur doit être authentifié
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # L'utilisateur ne peut accéder qu'à ses propres notifications
        return obj.recipient == request.user
