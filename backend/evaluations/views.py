from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from django.utils import timezone

from .models import Evaluation
from .serializers import (
    EvaluationSerializer,
    EvaluationFormSerializer,
    EvaluationSubmissionSerializer,
    CampaignEvaluationResultsSerializer
)
from campaigns.models import Campaign


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
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        """Get evaluation results for a specific campaign"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

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
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        """Get evaluation statistics for a specific campaign"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

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


# ============================================================================
# ENDPOINTS RH SIMPLIFIÉS - 2 VUES UNIQUEMENT
# ============================================================================
# 1. CampaignEvaluationResultsView - Afficher les évaluations par campagne
# 2. EvaluationStatisticsView - Afficher les statistiques par campagne
