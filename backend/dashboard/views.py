from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from campaigns.models import Campaign
from employees.models import Employee
from evaluations.models import Evaluation
from matching.models import EmployeePair

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_statistics(request):
    """Get dashboard statistics for the authenticated HR manager"""
    try:
        hr_manager = request.user

        # Get campaigns for this HR manager with optimized query
        hr_campaigns = Campaign.objects.filter(hr_manager=hr_manager).select_related('workflow_state')
        hr_campaign_ids = list(hr_campaigns.values_list('id', flat=True))

        if not hr_campaign_ids:
            # No campaigns, return zero stats
            data = {
                'total_employees': 0,
                'total_campaigns': 0,
                'total_evaluations': 0,
                'average_rating': 0,
                'active_campaigns': 0,
                'completed_campaigns': 0,
                'total_pairs': 0
            }
            return Response({'success': True, 'data': data})

        # Get total counts for this HR manager only (optimized)
        total_employees = Employee.objects.filter(campaign_id__in=hr_campaign_ids).distinct().count()
        total_campaigns = len(hr_campaign_ids)

        # Get evaluations stats in one query (optimized)
        evaluation_stats = Evaluation.objects.filter(
            employee_pair__campaign_id__in=hr_campaign_ids,
            used=True
        ).aggregate(
            total_count=Count('id'),
            avg_rating=Avg('rating')
        )

        total_evaluations = evaluation_stats['total_count'] or 0
        avg_rating = evaluation_stats['avg_rating']

        # Get active campaigns for this HR manager (optimized)
        today = timezone.now().date()
        active_campaigns = hr_campaigns.filter(
            start_date__lte=today,
            end_date__gte=today
        ).count()

        # Get completed campaigns for this HR manager (workflow step 5 completed)
        completed_campaigns = hr_campaigns.filter(
            workflow_state__completed_steps__contains=[5]
        ).count()

        # Get total pairs created for this HR manager's campaigns (optimized)
        total_pairs = EmployeePair.objects.filter(campaign_id__in=hr_campaign_ids).count()
        
        data = {
            'total_employees': total_employees,
            'total_campaigns': total_campaigns,
            'total_evaluations': total_evaluations,
            'average_rating': round(avg_rating, 1) if avg_rating else 0,
            'active_campaigns': active_campaigns,
            'completed_campaigns': completed_campaigns,
            'total_pairs': total_pairs
        }
        
        return Response({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_evaluations(request):
    """Get recent evaluations for dashboard"""
    try:
        limit = int(request.GET.get('limit', 4))
        hr_manager = request.user

        # Get campaigns for this HR manager (optimized)
        hr_campaign_ids = list(Campaign.objects.filter(hr_manager=hr_manager).values_list('id', flat=True))

        if not hr_campaign_ids:
            return Response({'success': True, 'data': []})

        evaluations = Evaluation.objects.select_related(
            'employee',
            'employee_pair__employee1',
            'employee_pair__employee2',
            'employee_pair__campaign'
        ).filter(
            employee_pair__campaign_id__in=hr_campaign_ids,  # Only evaluations from HR manager's campaigns
            used=True,  # Only used evaluations
            rating__isnull=False,  # Only evaluations with ratings
            comment__isnull=False,  # Only evaluations with comments
            comment__gt='',  # Only evaluations with non-empty comments
        ).exclude(
            comment__in=['', ' ', 'N/A', 'n/a', 'No comment', 'no comment', '-', 'None', 'null']  # Exclude meaningless comments
        ).order_by('-submitted_at')[:limit * 2]  # Get more records to filter in Python

        # Filter evaluations with meaningful comments (minimum 5 characters for better results)
        filtered_evaluations = [
            eval for eval in evaluations
            if eval.comment and len(eval.comment.strip()) >= 5
        ][:limit]

        data = []
        for evaluation in filtered_evaluations:
            # Get employee who submitted the evaluation
            employee_name = evaluation.employee.name if evaluation.employee else 'Unknown Employee'

            # Get partner from the pair
            if evaluation.employee_pair:
                if evaluation.employee == evaluation.employee_pair.employee1:
                    partner_name = evaluation.employee_pair.employee2.name
                elif evaluation.employee == evaluation.employee_pair.employee2:
                    partner_name = evaluation.employee_pair.employee1.name
                else:
                    # Fallback - just pick the other employee
                    partner_name = evaluation.employee_pair.employee2.name

                campaign_title = evaluation.employee_pair.campaign.title if evaluation.employee_pair.campaign else 'Unknown Campaign'
            else:
                partner_name = 'Unknown Partner'
                campaign_title = 'Unknown Campaign'

            data.append({
                'id': evaluation.id,
                'employee_name': employee_name,
                'partner_name': partner_name,
                'rating': evaluation.rating,
                'comment': evaluation.comment or '',
                'submitted_at': evaluation.submitted_at.isoformat(),
                'campaign_title': campaign_title
            })
        
        return Response({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rating_distribution(request):
    """Get rating distribution for dashboard"""
    try:
        hr_manager = request.user

        # Get campaigns for this HR manager
        hr_campaigns = Campaign.objects.filter(hr_manager=hr_manager)

        distribution = []

        for rating in range(1, 6):
            count = Evaluation.objects.filter(
                employee_pair__campaign__in=hr_campaigns,  # Only evaluations from HR manager's campaigns
                used=True,
                rating=rating
            ).count()
            distribution.append({
                'rating': rating,
                'count': count
            })
        
        return Response({
            'success': True,
            'data': distribution
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evaluation_trends(request):
    """Get evaluation trends over time"""
    try:
        period = request.GET.get('period', '6months')
        hr_manager = request.user

        # Get campaigns for this HR manager
        hr_campaigns = Campaign.objects.filter(hr_manager=hr_manager)

        # Calculate date range based on period
        end_date = timezone.now().date()
        if period == '6months':
            start_date = end_date - timedelta(days=180)
            date_format = '%Y-%m'
            group_by = 'month'
        elif period == '3months':
            start_date = end_date - timedelta(days=90)
            date_format = '%Y-%m'
            group_by = 'month'
        else:  # default to 6 months
            start_date = end_date - timedelta(days=180)
            date_format = '%Y-%m'
            group_by = 'month'

        # Get evaluations in date range (only used evaluations from HR manager's campaigns)
        evaluations = Evaluation.objects.filter(
            employee_pair__campaign__in=hr_campaigns,  # Only evaluations from HR manager's campaigns
            used=True,
            submitted_at__date__gte=start_date,
            submitted_at__date__lte=end_date
        )
        
        # Group by month and count
        trends = {}
        for evaluation in evaluations:
            month_key = evaluation.submitted_at.strftime(date_format)
            if month_key not in trends:
                trends[month_key] = 0
            trends[month_key] += 1
        
        # Convert to list format expected by frontend
        data = []
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime(date_format)
            label = current_date.strftime('%b') if group_by == 'month' else current_date.strftime('%d/%m')
            
            data.append({
                'label': label,
                'value': trends.get(month_key, 0)
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return Response({
            'success': True,
            'data': data[-6:]  # Return last 6 months
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """Get complete dashboard overview"""
    try:
        # Get all data in one endpoint for better performance
        stats_response = dashboard_statistics(request)
        evaluations_response = recent_evaluations(request)
        ratings_response = rating_distribution(request)
        trends_response = evaluation_trends(request)
        
        return Response({
            'success': True,
            'data': {
                'statistics': stats_response.data['data'] if stats_response.data['success'] else {},
                'recent_evaluations': evaluations_response.data['data'] if evaluations_response.data['success'] else [],
                'rating_distribution': ratings_response.data['data'] if ratings_response.data['success'] else [],
                'evaluation_trends': trends_response.data['data'] if trends_response.data['success'] else []
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
