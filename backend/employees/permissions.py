from rest_framework import permissions
from campaigns.models import Campaign

class IsEmployeeOwner(permissions.BasePermission):
    """
    Permission pour s'assurer que l'utilisateur ne peut accéder 
    qu'aux employees de ses propres campagnes.
    """

    def has_permission(self, request, view):
        # L'utilisateur doit être authentifié
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # L'utilisateur ne peut accéder qu'aux employees de ses propres campagnes
        if obj.campaign:
            return obj.campaign.hr_manager == request.user
        return False

    def has_filter_permission(self, request, view):
        """Vérifier les permissions pour les filtres de queryset"""
        # Pour les filtres par campaign_id, vérifier que la campagne appartient à l'utilisateur
        campaign_id = request.query_params.get('campaign_id')
        if campaign_id:
            try:
                campaign = Campaign.objects.get(id=campaign_id)
                return campaign.hr_manager == request.user
            except Campaign.DoesNotExist:
                return False
        return True
