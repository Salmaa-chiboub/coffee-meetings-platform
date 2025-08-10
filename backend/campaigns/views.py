# campaigns/views.py
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Prefetch, Count, Q
from django.core.cache import cache
from django.http import StreamingHttpResponse
import json
import time

from .models import Campaign, CampaignWorkflowState, CampaignWorkflowLog
from .serializers import (
    CampaignSerializer, CampaignWorkflowStateSerializer,
    WorkflowStepUpdateSerializer
)
from .permissions import IsCampaignOwner
from utils.cache_utils import cached_result
from employees.models import Employee
from matching.models import EmployeePair
from users.authentication import CustomJWTAuthentication


class CampaignPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]
    pagination_class = CampaignPagination
    filter_backends = [
        __import__('django_filters.rest_framework').rest_framework.DjangoFilterBackend,
        __import__('rest_framework.filters').filters.SearchFilter,
        __import__('rest_framework.filters').filters.OrderingFilter
    ]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'start_date', 'end_date']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filtrer les campagnes pour ne montrer que celles du HR manager connecté avec optimisations"""
        from django.db.models import Count
        return Campaign.objects.filter(hr_manager=self.request.user)\
                              .select_related('hr_manager')\
                              .annotate(employee_count=Count('employee'))\
                              .order_by('-created_at')

    # ENDPOINT NON UTILISÉ PAR LE FRONTEND - DÉSACTIVÉ
    # @action(detail=False, methods=['get'])
    # @cached_result(timeout=300, key_prefix=lambda request: f'campaign_aggregated_{request.user.id}')
    # def aggregated_campaigns(self, request):
    #     """Endpoint optimisé pour charger les campagnes avec leurs workflows"""
    #     from django.db.models import Count, Q
    #     from matching.models import CampaignMatchingCriteria
    #     
    #     campaigns = Campaign.objects.filter(hr_manager=request.user)\
    #         .select_related('workflow_state', 'hr_manager')\
    #         .prefetch_related(
    #             Prefetch('employee_set', queryset=Employee.objects.only('id', 'campaign_id')),
    #             Prefetch('employeepair_set', queryset=EmployeePair.objects.only('id', 'campaign_id')),
    #             'campaignmatchingcriteria_set'
    #         )\
    #         .annotate(
    #             employee_count=Count('employee', distinct=True),
    #             pairs_count=Count('employeepair', distinct=True)
    #         )\
    #         .order_by('-created_at')
    #     
    #     serializer = CampaignAggregatedSerializer(campaigns, many=True)
    #     return Response({
    #         'results': serializer.data,
    #         'count': campaigns.count()
    #     })

    def perform_create(self, serializer):
        """Associer automatiquement le hr_manager connecté à la campagne"""
        serializer.save(hr_manager=self.request.user)

    # ENDPOINT NON UTILISÉ PAR LE FRONTEND - DÉSACTIVÉ
    # Le frontend utilise /employees/by-campaign/ à la place
    # @action(detail=True, methods=['get'])
    # def employees(self, request, pk=None):
    #     """Get all employees for a specific campaign"""
    #     campaign = self.get_object()  # This will check permissions automatically
    # 
    #     # Import here to avoid circular imports
    #     from employees.models import Employee
    #     from employees.serializers import EmployeeSerializer
    # 
    #     employees = Employee.objects.filter(campaign=campaign).select_related('campaign').prefetch_related('employeeattribute_set')
    #     serializer = EmployeeSerializer(employees, many=True)
    # 
    #     return Response({
    #         'campaign': {
    #             'id': campaign.id,
    #             'title': campaign.title,
    #             'description': campaign.description,
    #             'start_date': campaign.start_date,
    #             'end_date': campaign.end_date
    #         },
    #         'employees': serializer.data,
    #         'count': employees.count()
    #     })

    def destroy(self, request, *args, **kwargs):
        campaign = self.get_object()

        if not campaign.can_be_deleted():
            return Response(
                {'error': 'Impossible de supprimer une campagne complétée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # La suppression en cascade est gérée automatiquement par Django
        # grâce aux relations on_delete=models.CASCADE définies dans les modèles
        campaign.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ============================================================================
# BULK ENDPOINT: LIST CAMPAIGNS WITH WORKFLOW (avoids N+1)
# GET /campaigns/with-workflow/?page=1&page_size=20&search=
# Caches response with a short TTL and invalidates via signals on changes
# ============================================================================
class CampaignsWithWorkflowView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Pagination params
            try:
                page = max(int(request.query_params.get('page', 1)), 1)
                page_size = min(int(request.query_params.get('page_size', 20)), 100)
            except (ValueError, TypeError):
                page = 1
                page_size = 20

            search = (request.query_params.get('search') or '').strip()

            # Cache key per user and params
            cache_key = f"campaigns_with_workflow:{request.user.id}:{page}:{page_size}:{search}"
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

            # Base queryset for this HR manager
            qs = Campaign.objects.filter(hr_manager=request.user) \
                .select_related('workflow_state', 'hr_manager') \
                .prefetch_related(
                    'campaignmatchingcriteria_set',
                    Prefetch('employee_set', queryset=Employee.objects.only('id', 'campaign_id')),
                    Prefetch('employeepair_set', queryset=EmployeePair.objects.only('id', 'campaign_id')),
                ) \
                .annotate(
                    employee_count=Count('employee', distinct=True),
                    pairs_count=Count('employeepair', distinct=True)
                ) \
                .order_by('-created_at')

            if search:
                qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

            total_count = qs.count()
            start = (page - 1) * page_size
            end = start + page_size
            page_qs = list(qs[start:end])

            # Build response payload
            results = []
            for c in page_qs:
                workflow = None
                if getattr(c, 'workflow_state', None):
                    workflow = CampaignWorkflowStateSerializer(c.workflow_state).data
                results.append({
                    'id': c.id,
                    'title': c.title,
                    'description': c.description,
                    'start_date': c.start_date,
                    'end_date': c.end_date,
                    'created_at': c.created_at,
                    'employees_count': getattr(c, 'employee_count', 0),
                    'pairs_count': getattr(c, 'pairs_count', 0),
                    'workflow_status': workflow,
                })

            payload = {
                'results': results,
                'count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size,
            }

            # Short TTL cache (30s). Signals will invalidate proactively on changes
            cache.set(cache_key, payload, timeout=30)
            return Response(payload)

        except Exception as e:
            return Response({'error': f'Failed to fetch campaigns with workflow: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkflowEventsView(APIView):
    """Simple SSE endpoint that notifies the client when workflow data changes for the user.
    Relies on a cache-based version key bumped by signals.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Support token via query parameter for SSE, since EventSource can't set Authorization header
        if not getattr(request.user, 'is_authenticated', False):
            token = request.query_params.get('token')
            if token:
                try:
                    request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
                    auth = CustomJWTAuthentication().authenticate(request)
                    if auth and auth[0]:
                        request.user = auth[0]
                except Exception:
                    pass

        if not getattr(request.user, 'is_authenticated', False):
            return Response({'detail': 'Authentication required'}, status=401)

        user_id = request.user.id
        version_key = f"workflow_version:{user_id}"
        start_version = cache.get(version_key, 0)

        def event_stream():
            sent_heartbeat = 0
            last_version = start_version
            # Keep connection open up to 60 seconds; client should reconnect
            end_time = time.time() + 60
            while time.time() < end_time:
                current_version = cache.get(version_key, 0)
                if current_version != last_version:
                    last_version = current_version
                    data = json.dumps({"event": "workflow-updated", "version": current_version})
                    yield f"data: {data}\n\n"
                # Heartbeat every 15s
                if sent_heartbeat >= 15:
                    yield "data: {\"event\": \"heartbeat\"}\n\n"
                    sent_heartbeat = 0
                time.sleep(1)
                sent_heartbeat += 1

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # for some reverse proxies
        return response

# Workflow Views
class CampaignWorkflowStatusView(APIView):
    """
    Get the current workflow status for a campaign
    GET /campaigns/{campaign_id}/workflow-status/
    """
    permission_classes = [permissions.IsAuthenticated, IsCampaignOwner]

    def get(self, request, campaign_id):
        try:
            # Get campaign with all related data
            campaign = Campaign.objects.filter(
                id=campaign_id, 
                hr_manager=request.user
            ).select_related(
                'workflow_state'
            ).prefetch_related(
                'campaignmatchingcriteria_set'
            ).first()

            if not campaign:
                return Response({'error': 'Campaign not found'}, status=404)

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


# ENDPOINTS NON UTILISÉS PAR LE FRONTEND - DÉSACTIVÉS
# class CompletedCampaignSerializer(serializers.ModelSerializer):
#     """Serializer for completed campaigns with optimized field handling"""
#     
#     completed = serializers.SerializerMethodField()
#     workflow_state = CampaignWorkflowStateSerializer(read_only=True)
#     total_criteria_count = serializers.IntegerField(read_only=True)
#     participants_count = serializers.IntegerField(read_only=True)
#     total_pairs_count = serializers.IntegerField(read_only=True)
# 
#     class Meta:
#         model = Campaign
#         fields = [
#             'id', 'title', 'description', 'start_date', 'end_date', 'created_at',
#             'total_criteria_count', 'participants_count', 'total_pairs_count',
#             'completed', 'workflow_state'
#         ]
#     
#     def get_completed(self, instance):
#         """Calculate whether the campaign is completed"""
#         try:
#             # Check workflow state first
#             if hasattr(instance, 'workflow_state') and instance.workflow_state:
#                 completed_steps = instance.workflow_state.completed_steps or []
#                 if 5 in completed_steps:
#                     return True
#             
#             # If not completed by workflow, check end date
#             if instance.end_date:
#                 return instance.end_date < timezone.now().date()
#                 
#             return False
#         except Exception as e:
#             print(f"DEBUG: Error calculating completion status: {str(e)}")
#             return False
#     
#     def to_representation(self, instance):
#         try:
#             print(f"DEBUG: Starting serialization of campaign {instance.id}")
#             
#             # Safely get counts with default values
#             try:
#                 total_criteria = int(instance.total_criteria_count)
#             except (TypeError, ValueError):
#                 total_criteria = 0
#                 
#             try:
#                 participants = int(instance.participants_count)
#             except (TypeError, ValueError):
#                 participants = 0
#                 
#             try:
#                 total_pairs = int(instance.total_pairs_count)
#             except (TypeError, ValueError):
#                 total_pairs = 0
#             
#             # Determine completion status
#             is_completed = False
#             try:
#                 if instance.workflow_state and instance.workflow_state.completed_steps:
#                     is_completed = 5 in instance.workflow_state.completed_steps
#                 elif instance.end_date and instance.end_date < timezone.now().date():
#                     is_completed = True
#                 print(f"DEBUG: Campaign {instance.id} completion status:")
#                 print(f"DEBUG: - Workflow state: {instance.workflow_state.completed_steps if instance.workflow_state else None}")
#                 print(f"DEBUG: - End date: {instance.end_date}")
#                 print(f"DEBUG: - Is completed: {is_completed}")
#             except Exception as e:
#                 print(f"DEBUG: Error determining completion status: {str(e)}")
#             
#             data = {
#                 'id': instance.id,
#                 'title': instance.title,
#                 'description': instance.description,
#                 'start_date': instance.start_date.strftime('%Y-%m-%d') if instance.start_date else None,
#                 'end_date': instance.end_date.strftime('%Y-%m-%d') if instance.end_date else None,
#                 'created_at': instance.created_at.isoformat() if instance.created_at else None,
#                 'total_criteria': total_criteria,
#                 'participants_count': participants,
#                 'total_pairs': total_pairs,
#                 'completed': is_completed
#             }
#             
#             print(f"DEBUG: Campaign {instance.id} counts:")
#             print(f"DEBUG: - Criteria: {instance.total_criteria_count}")
#             print(f"DEBUG: - Participants: {instance.participants_count}")
#             print(f"DEBUG: - Pairs: {instance.total_pairs_count}")
#             
#             return data
#             
#         except Exception as e:
#             print(f"DEBUG: Error serializing campaign {instance.id}: {str(e)}")
#             import traceback
#             traceback.print_exc()
#             return {
#                 'id': instance.id,
#                 'error': str(e)
#             }
#         
# class CompletedCampaignsView(APIView):
#     """
#     Optimized endpoint for completed campaigns with pagination
#     GET /campaigns/completed/
#     """
#     permission_classes = [permissions.IsAuthenticated]
#     serializer_class = CompletedCampaignSerializer
#     pagination_class = CampaignPagination
#     
#     def get_queryset(self):
#         """Get optimized queryset with all related data"""
#         try:
#             print("DEBUG: Building queryset in get_queryset")
#             
#             # Build base queryset with workflow state condition and prefetch related data
#             current_date = timezone.now().date()
#             base_qs = Campaign.objects.filter(
#                 hr_manager=self.request.user
#             ).select_related(
#                 'workflow_state'
#             ).prefetch_related(
#                 'campaignmatchingcriteria_set',
#                 'employee_set',
#                 'employeepair_set',
#                 'employeepair_set__evaluation_set'
#             ).annotate(
#                 has_completed_workflow=Q(workflow_state__completed_steps__contains=[5]),
#                 has_passed_end_date=Q(end_date__lt=current_date),
#                 is_completed=Q(has_completed_workflow=True) | Q(has_passed_end_date=True)
#             ).filter(
#                 Q(workflow_state__completed_steps__contains=[5]) |
#                 Q(end_date__lt=current_date)
#             )
# 
#             # Add annotations and return
#             return base_qs.annotate(
#                 total_criteria_count=Count('campaignmatchingcriteria', distinct=True),
#                 participants_count=Count('employee', distinct=True),
#                 total_pairs_count=Count('employeepair', distinct=True)
#             ).order_by('-created_at')
#             
#         except Exception as e:
#             print(f"DEBUG: Error in get_queryset: {str(e)}")
#             print("DEBUG: Full traceback:")
#             import traceback
#             traceback.print_exc()
#             raise
# 
#     def get(self, request):
#         """Get completed campaigns with pagination and optimized queries"""
#         try:
#             # Get pagination parameters with validation
#             try:
#                 page = max(int(request.query_params.get('page', 1)), 1)
#                 page_size = min(int(request.query_params.get('page_size', 10)), self.pagination_class.max_page_size)
#             except (ValueError, TypeError):
#                 page = 1
#                 page_size = 10
# 
#             # Log request info
#             print(f"DEBUG: Fetching completed campaigns for user {request.user.id}")
#             print(f"DEBUG: Pagination - page: {page}, size: {page_size}")
# 
#             # Get queryset and paginate
#             queryset = self.get_queryset()
#             paginator = self.pagination_class()
#             paginated_queryset = paginator.paginate_queryset(queryset, request)
# 
#             # Serialize data
#             serializer = self.serializer_class(paginated_queryset, many=True)
#             
#             return Response({
#                 'success': True,
#                 'campaigns': serializer.data,
#                 'pagination': {
#                     'current_page': page,
#                     'page_size': page_size,
#                     'total_count': queryset.count(),
#                     'total_pages': (queryset.count() + page_size - 1) // page_size,
#                     'has_next': page * page_size < queryset.count(),
#                     'has_previous': page > 1
#                 }
#             })
# 
#         except Exception as e:
#             return Response({
#                 'error': 'Failed to fetch completed campaigns',
#                 'details': str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# 
#     def _calculate_campaign_statistics_optimized(self, campaign):
#         """Calculate campaign statistics with optimized queries using prefetched data"""
#         # Get data from annotations
#         participants_count = campaign.participants_count or 0
#         total_pairs = campaign.total_pairs or 0
#         total_criteria = campaign.total_criteria or 0
# 
#         # Get evaluations from prefetched data
#         evaluations = []
#         pairs = campaign.employeepair_set.all()
#         for pair in pairs:
#             evaluations.extend(pair.evaluation_set.all())
# 
#         # Calculate evaluation statistics
#         used_evaluations = [e for e in evaluations if e.used]
#         total_evaluations = len(used_evaluations)
#         rated_evaluations = [e for e in used_evaluations if e.rating is not None]
#         avg_rating = (
#             round(sum(e.rating for e in rated_evaluations) / len(rated_evaluations), 2)
#             if rated_evaluations else None
#         )
# 
#         # Get completion date with safe access to JSON field
#         completion_date = None
#         if campaign.workflow_state:
#             try:
#                 step_data = campaign.workflow_state.step_data or {}
#                 step_5_data = step_data.get('5', {})
#                 completion_date = step_5_data.get('completion_date')
#             except Exception:
#                 pass
# 
#         if not completion_date:
#             completion_date = campaign.end_date
# 
#         # Calculate duration in days
#         start_date = campaign.start_date
#         end_date = campaign.end_date
#         if start_date and end_date:
#             duration = (end_date - start_date).days
#         else:
#             duration = 0
# 
#         return {
#             'id': campaign.id,
#             'title': campaign.title,
#             'description': campaign.description,
#             'start_date': start_date,
#             'end_date': end_date,
#             'created_at': campaign.created_at,
#             'completion_date': completion_date,
#             'participants_count': participants_count,
#             'total_pairs': total_pairs,
#             'total_evaluations': total_evaluations,
#             'average_rating': avg_rating,
#             'total_criteria': total_criteria,
#             'duration': duration
#         }
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
