# campaigns/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Campaign, CampaignWorkflowState, CampaignWorkflowLog
from .serializers import (
    CampaignSerializer, CampaignWorkflowStateSerializer,
    WorkflowStepUpdateSerializer, WorkflowValidationSerializer
)
from .permissions import IsCampaignOwner


class CampaignPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]
    pagination_class = CampaignPagination

    def get_queryset(self):
        """Filtrer les campagnes pour ne montrer que celles du HR manager connecté avec optimisations"""
        from django.db.models import Count
        return Campaign.objects.filter(hr_manager=self.request.user)\
                              .select_related('hr_manager')\
                              .annotate(employee_count=Count('employee'))\
                              .order_by('-created_at')

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


# Workflow Views
class CampaignWorkflowStatusView(APIView):
    """
    Get the current workflow status for a campaign
    GET /campaigns/{campaign_id}/workflow-status/
    """
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]

    def get(self, request, campaign_id):
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

            # Get or create workflow state
            workflow_state, created = CampaignWorkflowState.objects.get_or_create(
                campaign=campaign,
                defaults={
                    'current_step': 2,  # Start from step 2 (Upload Employees)
                    'completed_steps': [1],  # Step 1 (Create Campaign) is already completed
                    'step_data': {
                        '1': {
                            'title': campaign.title,
                            'description': campaign.description,
                            'start_date': campaign.start_date.isoformat(),
                            'end_date': campaign.end_date.isoformat(),
                            'created_at': campaign.created_at.isoformat()
                        }
                    }
                }
            )

            # If just created, mark step 1 as completed
            if created:
                workflow_state.mark_step_completed(1, {
                    'title': campaign.title,
                    'description': campaign.description,
                    'start_date': campaign.start_date.isoformat(),
                    'end_date': campaign.end_date.isoformat(),
                    'created_at': campaign.created_at.isoformat()
                })

            serializer = CampaignWorkflowStateSerializer(workflow_state)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to get workflow status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CampaignWorkflowStepUpdateView(APIView):
    """
    Update workflow step completion status
    POST /campaigns/{campaign_id}/workflow-step/
    """
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]

    def post(self, request, campaign_id):
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

            serializer = WorkflowStepUpdateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'error': 'Invalid request data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            step_number = serializer.validated_data['step']
            completed = serializer.validated_data['completed']
            step_data = serializer.validated_data.get('data', {})

            # Get or create workflow state
            workflow_state, created = CampaignWorkflowState.objects.get_or_create(
                campaign=campaign,
                defaults={
                    'current_step': 2,
                    'completed_steps': [1],
                    'step_data': {}
                }
            )

            # Update step
            if completed:
                workflow_state.mark_step_completed(step_number, step_data)
                action = 'completed'
            else:
                workflow_state.mark_step_incomplete(step_number)
                action = 'incomplete'

            # Log the action
            CampaignWorkflowLog.objects.create(
                campaign=campaign,
                step_number=step_number,
                action=action,
                user=getattr(request.user, 'email', 'unknown'),
                data=step_data
            )

            serializer = CampaignWorkflowStateSerializer(workflow_state)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to update workflow step: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CampaignWorkflowValidationView(APIView):
    """
    Validate if a workflow step can be accessed
    GET /campaigns/{campaign_id}/workflow-validate/{step}/
    """
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]

    def get(self, request, campaign_id, step):
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)
            step_number = int(step)

            workflow_state, created = CampaignWorkflowState.objects.get_or_create(
                campaign=campaign,
                defaults={
                    'current_step': 2,
                    'completed_steps': [1],
                    'step_data': {}
                }
            )

            # Check if step can be accessed
            can_access = workflow_state.can_access_step(step_number)
            errors = workflow_state.get_step_validation_errors(step_number)

            response_data = {
                'step': step_number,
                'can_access': can_access,
                'is_completed': step_number in workflow_state.completed_steps,
                'errors': errors,
                'warnings': []
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to validate workflow step: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompletedCampaignsView(APIView):
    """
    Optimized endpoint for completed campaigns with pagination
    GET /campaigns/completed/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get completed campaigns with pagination and optimized queries"""
        try:
            # Get pagination parameters
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            offset = (page - 1) * page_size

            # Get campaigns for the authenticated HR manager with optimized query
            campaigns_query = Campaign.objects.filter(
                hr_manager=request.user,
                workflow_state__completed_steps__contains=[5]  # Only completed campaigns
            ).select_related(
                'hr_manager',
                'workflow_state'
            ).prefetch_related(
                'employeepair_set',
                'employeepair_set__evaluation_set'
            ).order_by('-created_at')

            # Get total count for pagination
            total_count = campaigns_query.count()

            # Apply pagination
            campaigns = campaigns_query[offset:offset + page_size]

            # Calculate statistics for paginated campaigns
            completed_campaigns = []
            for campaign in campaigns:
                campaign_data = self._calculate_campaign_statistics_optimized(campaign)
                completed_campaigns.append(campaign_data)

            # Calculate pagination info
            has_next = offset + page_size < total_count
            has_previous = page > 1

            return Response({
                'success': True,
                'campaigns': completed_campaigns,
                'pagination': {
                    'current_page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                    'has_next': has_next,
                    'has_previous': has_previous
                }
            })

        except Exception as e:
            return Response({
                'error': 'Failed to fetch completed campaigns',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _calculate_campaign_statistics_optimized(self, campaign):
        """Calculate campaign statistics with optimized queries"""
        from matching.models import EmployeePair
        from evaluations.models import Evaluation
        from employees.models import Employee
        from django.db.models import Count, Avg

        # Use prefetched data when possible
        pairs = campaign.employeepair_set.all()
        total_pairs = len(pairs)

        # Get participants count
        participants_count = Employee.objects.filter(campaign=campaign).count()

        # Get evaluations data
        evaluations = []
        for pair in pairs:
            evaluations.extend(pair.evaluation_set.all())

        total_evaluations = len([e for e in evaluations if e.used])
        avg_rating = sum(e.rating for e in evaluations if e.used and e.rating) / max(1, len([e for e in evaluations if e.used and e.rating]))

        # Get completion date from workflow
        completion_date = None
        if hasattr(campaign, 'workflow_state') and campaign.workflow_state:
            step_5_data = campaign.workflow_state.step_data.get('5', {})
            completion_date = step_5_data.get('completion_date')

        if not completion_date:
            completion_date = campaign.end_date

        return {
            'id': campaign.id,
            'title': campaign.title,
            'description': campaign.description,
            'start_date': campaign.start_date,
            'end_date': campaign.end_date,
            'created_at': campaign.created_at,
            'completion_date': completion_date,
            'participants_count': participants_count,
            'total_pairs': total_pairs,
            'total_evaluations': total_evaluations,
            'average_rating': round(avg_rating, 2) if avg_rating else None,
            'total_criteria': 0  # Can be calculated if needed
        }


class CampaignWorkflowResetView(APIView):
    """
    Reset workflow from a specific step
    POST /campaigns/{campaign_id}/workflow-reset/
    """
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]

    def post(self, request, campaign_id):
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)
            from_step = request.data.get('from_step')

            if not from_step or not isinstance(from_step, int) or from_step < 1 or from_step > 5:
                return Response(
                    {'error': 'Invalid from_step parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            workflow_state, created = CampaignWorkflowState.objects.get_or_create(
                campaign=campaign,
                defaults={
                    'current_step': 2,
                    'completed_steps': [1],
                    'step_data': {}
                }
            )

            # Reset workflow
            workflow_state.reset_from_step(from_step)

            # Log the action
            CampaignWorkflowLog.objects.create(
                campaign=campaign,
                step_number=from_step,
                action='reset',
                user=getattr(request.user, 'email', 'unknown'),
                data={'reset_from_step': from_step}
            )

            serializer = CampaignWorkflowStateSerializer(workflow_state)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to reset workflow: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
