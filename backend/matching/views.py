from rest_framework import viewsets
from .models import CampaignMatchingCriteria, EmployeePair
from .serializers import CampaignMatchingCriteriaSerializer, EmployeePairSerializer

class CampaignMatchingCriteriaViewSet(viewsets.ModelViewSet):
    queryset = CampaignMatchingCriteria.objects.all()
    serializer_class = CampaignMatchingCriteriaSerializer

class EmployeePairViewSet(viewsets.ModelViewSet):
    queryset = EmployeePair.objects.all()
    serializer_class = EmployeePairSerializer
