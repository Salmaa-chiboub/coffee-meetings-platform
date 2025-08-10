import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Employee, EmployeeAttribute
from .serializers import (
    EmployeeSerializer, EmployeeAttributeSerializer, EmployeeCreateSerializer,
    ExcelUploadSerializer, ExcelProcessingResultSerializer
)
from .services import ExcelProcessingService
from campaigns.models import Campaign
from .permissions import IsEmployeeOwner

logger = logging.getLogger(__name__)


class EmployeePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsEmployeeOwner]
    pagination_class = EmployeePagination
    # parser_classes will be set per action
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['campaign']
    search_fields = ['name', 'email']
    ordering_fields = ['name', 'email', 'arrival_date']
    ordering = ['name']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeSerializer

    def get_queryset(self):
        """Filter queryset to only show employees from user's campaigns"""
        # Base queryset with optimizations
        queryset = Employee.objects.select_related('campaign').prefetch_related('employeeattribute_set')
        
        # Filter by user's campaigns only
        user_campaign_ids = Campaign.objects.filter(hr_manager=self.request.user).values_list('id', flat=True)
        queryset = queryset.filter(campaign_id__in=user_campaign_ids)

        # Additional filter by campaign if provided
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            # Verify the campaign belongs to the user
            if int(campaign_id) in user_campaign_ids:
                queryset = queryset.filter(campaign_id=campaign_id)
            else:
                # Return empty queryset if campaign doesn't belong to user
                return Employee.objects.none()

        return queryset

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_excel(self, request):
        """
        Upload and process Excel file with employee data

        Expected payload:
        - file: Excel file (.xlsx or .xls)
        - campaign_id: ID of the campaign to associate employees with
        """
        # Log upload attempt
        file_info = request.FILES.get('file')
        if file_info:
            logger.info(f"Excel upload attempt: {file_info.name}, size: {file_info.size} bytes")

        serializer = ExcelUploadSerializer(data=request.data)

        if not serializer.is_valid():
            logger.warning(f"Excel upload validation failed: {serializer.errors}")
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Process Excel file
            campaign_id = serializer.validated_data['campaign_id']
            replace_existing = serializer.validated_data.get('replace_existing', False)

            logger.info(f"Starting Excel processing for campaign {campaign_id}, replace_existing: {replace_existing}")

            service = ExcelProcessingService(campaign_id, replace_existing=replace_existing)
            result = service.process_excel_file(serializer.validated_data['file'])

            # Serialize employees for response
            if result['success'] and result.get('employees'):
                employees_serializer = EmployeeSerializer(result['employees'], many=True)
                result['employees'] = employees_serializer.data

            # Return result directly (no need for additional serializer validation)
            if result['success']:
                logger.info(f"Successfully processed Excel file: {result['created_employees']} employees created")
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                logger.warning(f"Excel processing failed: {result.get('error', 'Unknown error')}")
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except MemoryError as e:
            logger.error(f"Memory error during Excel processing: {str(e)}")
            return Response(
                {'error': 'File too large', 'message': 'The file is too large to process. Please reduce the file size or split into smaller files.'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        except Exception as e:
            logger.error(f"Unexpected error during Excel processing: {str(e)}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response(
                {'error': 'Internal server error', 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def by_campaign(self, request):
        """Get employees filtered by campaign"""
        campaign_id = request.query_params.get('campaign_id')

        if not campaign_id:
            return Response(
                {'error': 'campaign_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verify the campaign belongs to the user
            campaign = Campaign.objects.get(id=campaign_id, hr_manager=request.user)
        except Campaign.DoesNotExist:
            return Response(
                {'error': 'Campaign not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )

        employees = self.get_queryset().filter(campaign=campaign)
        serializer = self.get_serializer(employees, many=True)

        return Response({
            'campaign': {
                'id': campaign.id,
                'title': campaign.title,
                'description': campaign.description
            },
            'employees': serializer.data,
            'count': employees.count()
        })

    @action(detail=False, methods=['delete'])
    def delete_by_campaign(self, request):
        """Delete all employees for a specific campaign"""
        campaign_id = request.query_params.get('campaign_id')

        if not campaign_id:
            return Response(
                {'error': 'campaign_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verify the campaign belongs to the user
            campaign = Campaign.objects.get(id=campaign_id, hr_manager=request.user)
        except Campaign.DoesNotExist:
            return Response(
                {'error': 'Campaign not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Count employees before deletion
        employee_count = Employee.objects.filter(campaign=campaign).count()

        # Delete all employees for this campaign
        Employee.objects.filter(campaign=campaign).delete()

        logger.info(f"Deleted {employee_count} employees for campaign {campaign.id}")

        return Response({
            'success': True,
            'message': f'Successfully deleted {employee_count} employees from campaign "{campaign.title}"',
            'deleted_count': employee_count,
            'campaign': {
                'id': campaign.id,
                'title': campaign.title
            }
        })


class EmployeeAttributeViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAttribute.objects.all()
    serializer_class = EmployeeAttributeSerializer
    permission_classes = [IsAuthenticated, IsEmployeeOwner]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['employee', 'campaign', 'attribute_key']
    search_fields = ['attribute_key', 'attribute_value']

    def get_queryset(self):
        """Filter queryset to only show attributes from user's campaigns"""
        # Base queryset
        queryset = EmployeeAttribute.objects.select_related('employee', 'campaign')
        
        # Filter by user's campaigns only
        user_campaign_ids = Campaign.objects.filter(hr_manager=self.request.user).values_list('id', flat=True)
        queryset = queryset.filter(campaign_id__in=user_campaign_ids)

        return queryset
