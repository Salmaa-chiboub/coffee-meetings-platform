# campaigns/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Campaign
from .serializers import CampaignSerializer
from .permissions import IsCampaignOwner

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]

    def get_queryset(self):
        """Filtrer les campagnes pour ne montrer que celles du HR manager connecté"""
        return Campaign.objects.filter(hr_manager=self.request.user)

    def perform_create(self, serializer):
        """Associer automatiquement le hr_manager connecté à la campagne"""
        serializer.save(hr_manager=self.request.user)
