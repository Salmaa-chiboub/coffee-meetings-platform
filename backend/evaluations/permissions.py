from rest_framework import permissions
from campaigns.models import Campaign

class IsEvaluationOwner(permissions.BasePermission):
    """
    Permission pour s'assurer que l'utilisateur ne peut accéder 
    qu'aux evaluations de ses propres campagnes.
    """

    def has_permission(self, request, view):
        # L'utilisateur doit être authentifié
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # L'utilisateur ne peut accéder qu'aux evaluations de ses propres campagnes
        if hasattr(obj, 'employee_pair') and obj.employee_pair.campaign:
            return obj.employee_pair.campaign.hr_manager == request.user
        return False

    def has_campaign_permission(self, request, campaign_id):
        """Vérifier que la campagne appartient à l'utilisateur"""
        try:
            campaign = Campaign.objects.get(id=campaign_id)
            return campaign.hr_manager == request.user
        except Campaign.DoesNotExist:
            return False
