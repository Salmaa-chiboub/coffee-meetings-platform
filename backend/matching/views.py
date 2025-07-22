from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import CampaignMatchingCriteria, EmployeePair
from .serializers import CampaignMatchingCriteriaSerializer, EmployeePairSerializer

class CampaignMatchingCriteriaViewSet(viewsets.ModelViewSet):
    queryset = CampaignMatchingCriteria.objects.all()
    serializer_class = CampaignMatchingCriteriaSerializer
    permission_classes = [IsAuthenticated]

class EmployeePairViewSet(viewsets.ModelViewSet):
    queryset = EmployeePair.objects.all()
    serializer_class = EmployeePairSerializer
    permission_classes = [IsAuthenticated]
