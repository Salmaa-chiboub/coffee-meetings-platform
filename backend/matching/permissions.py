from rest_framework import permissions
from campaigns.models import Campaign

class IsMatchingOwner(permissions.BasePermission):
    """
    Permission pour s'assurer que l'utilisateur ne peut accéder 
    qu'aux données de matching de ses propres campagnes.
    """

    def has_permission(self, request, view):
        # L'utilisateur doit être authentifié
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # L'utilisateur ne peut accéder qu'aux données de ses propres campagnes
        if hasattr(obj, 'campaign'):
            return obj.campaign.hr_manager == request.user
        return False

    def has_campaign_permission(self, request, campaign_id):
        """Vérifier que la campagne appartient à l'utilisateur"""
        try:
            campaign = Campaign.objects.get(id=campaign_id)
            return campaign.hr_manager == request.user
        except Campaign.DoesNotExist:
            return False
