# campaigns/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
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

    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        """Get all employees for a specific campaign"""
        campaign = self.get_object()  # This will check permissions automatically

        # Import here to avoid circular imports
        from employees.models import Employee
        from employees.serializers import EmployeeSerializer

        employees = Employee.objects.filter(campaign=campaign).select_related('campaign').prefetch_related('employeeattribute_set')
        serializer = EmployeeSerializer(employees, many=True)

        return Response({
            'campaign': {
                'id': campaign.id,
                'title': campaign.title,
                'description': campaign.description,
                'start_date': campaign.start_date,
                'end_date': campaign.end_date
            },
            'employees': serializer.data,
            'count': employees.count()
        })
