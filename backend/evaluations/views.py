from django.db.models import Count, Avg, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Evaluation
from campaigns.models import Campaign
from campaigns.permissions import IsCampaignOwner
from .permissions import IsEvaluationOwner

class EvaluationStatisticsView(APIView):
    """View for getting evaluation statistics for a campaign"""
    permission_classes = [IsAuthenticated, IsCampaignOwner]

    def get(self, request, campaign_id):
        """Get evaluation statistics for a specific campaign"""
        try:
            # Get campaign with prefetched data
            campaign = get_object_or_404(
                Campaign.objects.select_related('workflow_state')
                .prefetch_related('campaignmatchingcriteria_set'),
                id=campaign_id,
                hr_manager=request.user
            )

            # Get evaluation statistics with optimized query
            evaluations = Evaluation.objects.filter(
                employee_pair__campaign=campaign
            ).aggregate(
                total_count=Count('id'),
                completed_count=Count('id', filter=Q(completed=True)),
                average_rating=Avg('rating', filter=Q(rating__isnull=False))
            )

            return Response({
                'campaign_id': campaign_id,
                'total_evaluations': evaluations['total_count'] or 0,
                'completed_evaluations': evaluations['completed_count'] or 0,
                'average_rating': round(evaluations['average_rating'], 2) if evaluations['average_rating'] else None
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to get evaluation statistics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from .serializers import (
    EvaluationSerializer,
    EvaluationFormSerializer,
    EvaluationSubmissionSerializer,
    CampaignEvaluationResultsSerializer
)


# ViewSet supprimé - utilisation des vues spécifiques uniquement


class EvaluationFormView(APIView):
    """
    Public endpoint to display evaluation form by token
    GET /evaluations/evaluate/{token}/
    """
    permission_classes = []  # No authentication required

    def get(self, request, token):
        """Get evaluation form data by token"""
        try:
            evaluation = get_object_or_404(Evaluation, token=token)

            # Check if already submitted
            if evaluation.used:
                return Response({
                    'error': 'This evaluation has already been submitted',
                    'message': 'Thank you for your feedback. This evaluation link is no longer active.',
                    'submitted_at': evaluation.submitted_at
                }, status=status.HTTP_410_GONE)

            # Return form data
            serializer = EvaluationFormSerializer(evaluation)
            return Response({
                'success': True,
                'evaluation': serializer.data,
                'message': 'Evaluation form ready for submission'
            })

        except Evaluation.DoesNotExist:
            return Response({
                'error': 'Invalid evaluation token',
                'message': 'The evaluation link is invalid or has expired.'
            }, status=status.HTTP_404_NOT_FOUND)


class EvaluationSubmissionView(APIView):
    """
    Public endpoint to submit evaluation by token
    POST /evaluations/evaluate/{token}/
    """
    permission_classes = []  # No authentication required

    def post(self, request, token):
        """Submit evaluation by token"""
        try:
            evaluation = get_object_or_404(Evaluation, token=token)

            # Check if already submitted
            if evaluation.used:
                return Response({
                    'error': 'This evaluation has already been submitted',
                    'message': 'Thank you for your feedback. This evaluation link is no longer active.',
                    'submitted_at': evaluation.submitted_at
                }, status=status.HTTP_410_GONE)

            # Validate and save submission
            serializer = EvaluationSubmissionSerializer(evaluation, data=request.data, partial=True)
            if serializer.is_valid():
                # Mark as used and save
                serializer.save(used=True, submitted_at=timezone.now())

                return Response({
                    'success': True,
                    'message': 'Thank you for your feedback! Your evaluation has been submitted successfully.',
                    'submitted_at': timezone.now()
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid data',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Evaluation.DoesNotExist:
            return Response({
                'error': 'Invalid evaluation token',
                'message': 'The evaluation link is invalid or has expired.'
            }, status=status.HTTP_404_NOT_FOUND)


class CampaignEvaluationResultsView(APIView):
    """
    Protected endpoint for HR managers to view campaign evaluation results
    GET /evaluations/campaigns/{campaign_id}/results/
    """
    permission_classes = [IsAuthenticated, IsEvaluationOwner]

    def get(self, request, campaign_id):
        """Get evaluation results for a specific campaign"""
        try:
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

            # Get all evaluations for this campaign
            evaluations = Evaluation.objects.filter(
                employee_pair__campaign=campaign,
                used=True
            ).select_related('employee', 'employee_pair')

            # Calculate statistics
            stats = evaluations.aggregate(
                total_evaluations=Count('id'),
                average_rating=Avg('rating'),
                total_with_rating=Count('rating'),
                total_with_comments=Count('comment', filter=Q(comment__isnull=False))
            )

            # Get rating distribution
            rating_distribution = evaluations.values('rating').annotate(
                count=Count('rating')
            ).order_by('rating')

            # Serialize evaluation details
            serializer = CampaignEvaluationResultsSerializer(evaluations, many=True)

            return Response({
                'success': True,
                'campaign': {
                    'id': campaign.id,
                    'title': campaign.title,
                    'start_date': campaign.start_date,
                    'end_date': campaign.end_date
                },
                'statistics': {
                    'total_evaluations': stats['total_evaluations'],
                    'average_rating': round(stats['average_rating'], 2) if stats['average_rating'] else None,
                    'evaluations_with_rating': stats['total_with_rating'],
                    'evaluations_with_comments': stats['total_with_comments'],
                    'response_rate': self._calculate_response_rate(campaign, stats['total_evaluations'])
                },
                'rating_distribution': list(rating_distribution),
                'evaluations': serializer.data
            })

        except Campaign.DoesNotExist:
            return Response({
                'error': 'Campaign not found'
            }, status=status.HTTP_404_NOT_FOUND)

    def _calculate_response_rate(self, campaign, submitted_evaluations):
        """Calculate response rate for the campaign"""
        from matching.models import EmployeePair

        total_pairs = EmployeePair.objects.filter(campaign=campaign).count()
        expected_evaluations = total_pairs * 2  # 2 evaluations per pair

        if expected_evaluations > 0:
            return round((submitted_evaluations / expected_evaluations) * 100, 1)
        return 0


class EvaluationStatisticsView(APIView):
    """
    Protected endpoint to get evaluation statistics per campaign
    GET /evaluations/campaigns/{campaign_id}/statistics/
    """
    permission_classes = [IsAuthenticated, IsEvaluationOwner]

    def get(self, request, campaign_id):
        """Get evaluation statistics for a specific campaign"""
        try:
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

            # Get evaluation counts
            total_evaluations = Evaluation.objects.filter(
                employee_pair__campaign=campaign
            ).count()

            submitted_evaluations = Evaluation.objects.filter(
                employee_pair__campaign=campaign,
                used=True
            ).count()

            pending_evaluations = total_evaluations - submitted_evaluations

            # Get rating statistics
            rating_stats = Evaluation.objects.filter(
                employee_pair__campaign=campaign,
                used=True,
                rating__isnull=False
            ).aggregate(
                average_rating=Avg('rating'),
                total_ratings=Count('rating')
            )

            # Calculate response rate
            from matching.models import EmployeePair
            total_pairs = EmployeePair.objects.filter(campaign=campaign).count()
            expected_evaluations = total_pairs * 2
            response_rate = (submitted_evaluations / expected_evaluations * 100) if expected_evaluations > 0 else 0

            return Response({
                'success': True,
                'campaign_id': campaign_id,
                'campaign_title': campaign.title,
                'statistics': {
                    'total_pairs': total_pairs,
                    'total_evaluations_generated': total_evaluations,
                    'evaluations_submitted': submitted_evaluations,
                    'evaluations_pending': pending_evaluations,
                    'response_rate': round(response_rate, 1),
                    'average_rating': round(rating_stats['average_rating'], 2) if rating_stats['average_rating'] else None,
                    'total_ratings': rating_stats['total_ratings']
                }
            })

        except Campaign.DoesNotExist:
            return Response({
                'error': 'Campaign not found'
            }, status=status.HTTP_404_NOT_FOUND)


# ENDPOINT NON UTILISÉ PAR LE FRONTEND - DÉSACTIVÉ
# class GlobalEvaluationStatisticsView(APIView):
#     """
#     Protected endpoint for HR managers to view their evaluation statistics
#     GET /evaluations/global-statistics/
#     """
#     permission_classes = [IsAuthenticated]
# 
#     def get(self, request):
#         """Get evaluation statistics for campaigns of the connected HR manager"""
#         try:
#             # Get the connected HR manager (user is the HR manager directly)
#             hr_manager = request.user
# 
#             # Get campaigns of this HR manager that have pairs generated (step 4 completed)
#             completed_campaigns = Campaign.objects.filter(
#                 hr_manager=hr_manager,
#                 workflow_state__completed_steps__contains=[4]
#             )
# 
#             # If no campaigns with workflow, fall back to HR manager's campaigns with pairs
#             if not completed_campaigns.exists():
#                 from matching.models import EmployeePair
#                 campaign_ids_with_pairs = EmployeePair.objects.filter(
#                     campaign__hr_manager=hr_manager
#                 ).values_list('campaign_id', flat=True).distinct()
#                 completed_campaigns = Campaign.objects.filter(id__in=campaign_ids_with_pairs)
# 
#             if not completed_campaigns.exists():
#                 return Response({
#                     'success': True,
#                     'statistics': {
#                         'total_campaigns': 0,
#                         'total_pairs': 0,
#                         'total_evaluations_generated': 0,
#                         'evaluations_submitted': 0,
#                         'evaluations_pending': 0,
#                         'response_rate': 0,
#                         'average_rating': None,
#                         'total_ratings': 0,
#                         'global_performance': 'No Data'
#                     }
#                 })
# 
#             # Calculate global statistics
#             from matching.models import EmployeePair
# 
#             # Total pairs across all completed campaigns
#             total_pairs = EmployeePair.objects.filter(
#                 campaign__in=completed_campaigns
#             ).count()
# 
#             # Total evaluations generated (2 per pair)
#             total_evaluations_generated = Evaluation.objects.filter(
#                 employee_pair__campaign__in=completed_campaigns
#             ).count()
# 
#             # Submitted evaluations
#             evaluations_submitted = Evaluation.objects.filter(
#                 employee_pair__campaign__in=completed_campaigns,
#                 used=True
#             ).count()
# 
#             # Pending evaluations
#             evaluations_pending = total_evaluations_generated - evaluations_submitted
# 
#             # Response rate
#             response_rate = (evaluations_submitted / total_evaluations_generated * 100) if total_evaluations_generated > 0 else 0
# 
#             # Rating statistics
#             rating_stats = Evaluation.objects.filter(
#                 employee_pair__campaign__in=completed_campaigns,
#                 used=True,
#                 rating__isnull=False
#             ).aggregate(
#                 average_rating=Avg('rating'),
#                 total_ratings=Count('rating')
#             )
# 
#             # Calculate global performance
#             avg_rating = rating_stats['average_rating'] or 0
#             performance_level = 'Poor'
# 
#             if response_rate >= 80 and avg_rating >= 4:
#                 performance_level = 'Excellent'
#             elif response_rate >= 60 and avg_rating >= 3.5:
#                 performance_level = 'Good'
#             elif response_rate >= 40 and avg_rating >= 3:
#                 performance_level = 'Average'
#             elif response_rate >= 20 and avg_rating >= 2:
#                 performance_level = 'Below Average'
# 
#             return Response({
#                 'success': True,
#                 'statistics': {
#                     'total_campaigns': completed_campaigns.count(),
#                     'total_pairs': total_pairs,
#                     'total_evaluations_generated': total_evaluations_generated,
#                     'evaluations_submitted': evaluations_submitted,
#                     'evaluations_pending': evaluations_pending,
#                     'response_rate': round(response_rate, 1),
#                     'average_rating': round(avg_rating, 2) if avg_rating else None,
#                     'total_ratings': rating_stats['total_ratings'],
#                     'global_performance': performance_level
#                 }
#             })
# 
#         except Exception as e:
#             return Response({
#                 'error': 'Failed to fetch global statistics',
#                 'details': str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# ENDPOINTS RH SIMPLIFIÉS - 2 VUES UNIQUEMENT
# ============================================================================
# 1. CampaignEvaluationResultsView - Afficher les évaluations par campagne
# 2. EvaluationStatisticsView - Afficher les statistiques par campagne
