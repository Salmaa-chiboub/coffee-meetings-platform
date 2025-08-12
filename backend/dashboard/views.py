from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db import models
from django.db.models import (
    Count, Avg, Q, F, Case, When, Value,
    ExpressionWrapper, FloatField
)
from django.utils import timezone
from django.http import HttpResponse
from django.db.models.functions import TruncMonth
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4, landscape
from campaigns.models import Campaign, CampaignWorkflowState  # Ajout de l'import de CampaignWorkflowState
from employees.models import Employee
from evaluations.models import Evaluation
from matching.models import EmployeePair
from .decorators import cache_dashboard_response
from dateutil.relativedelta import relativedelta

class OptimizedPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

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
    """Get evaluation trends: current month + 5 previous months"""
    try:
        hr_manager = request.user

        # Get campaigns for this HR manager
        hr_campaigns = Campaign.objects.filter(hr_manager=hr_manager)

        # Date range: from 1st day of 5 months ago until last day of current month
        end_date = timezone.now().date().replace(day=1)  # début du mois actuel
        start_date = (end_date - relativedelta(months=5))  # début du mois d'il y a 5 mois

        date_format = '%Y-%m'

        # Get evaluations in date range
        evaluations = Evaluation.objects.filter(
            employee_pair__campaign__in=hr_campaigns,
            used=True,
            submitted_at__date__gte=start_date,
            submitted_at__date__lte=end_date + relativedelta(months=1) - timedelta(days=1)  # fin du mois actuel
        )

        # Group by month and count
        trends = {}
        for evaluation in evaluations:
            month_key = evaluation.submitted_at.strftime(date_format)
            trends[month_key] = trends.get(month_key, 0) + 1

        # Build data: exactly 6 months from start_date to end_date
        data = []
        current_date = end_date
        for i in range(6):
            month_key = current_date.strftime(date_format)
            label = current_date.strftime('%b')
            data.append({
                'label': label,
                'value': trends.get(month_key, 0)
            })
            current_date -= relativedelta(months=1)

        # Reverse to have chronological order (oldest → newest)
        data.reverse()

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_dashboard_response(timeout=300)  # Cache pour 5 minutes
def campaign_history_statistics(request):
    """Get comprehensive campaign history statistics with optimized queries"""
    try:
        hr_manager = request.user

        # Requête de base optimisée
        base_queryset = Campaign.objects.filter(
            hr_manager=hr_manager
        ).select_related(
            'workflow_state'
        ).prefetch_related(
            'employeepair_set',
            'employee_set',
            'campaignmatchingcriteria_set'
        ).annotate(
            pairs_count=Count('employeepair', distinct=True),
            employees_count=Count('employee', distinct=True),
            criteria_count=Count('campaignmatchingcriteria', distinct=True),
            evaluation_count=Count(
                'employeepair__evaluation',
                filter=Q(employeepair__evaluation__used=True),
                distinct=True
            ),
            average_rating=Avg(
                'employeepair__evaluation__rating',
                filter=Q(employeepair__evaluation__used=True)
            ),
            response_rate=Case(
                When(pairs_count__gt=0,
                     then=ExpressionWrapper(
                         F('evaluation_count') * 100.0 / (F('pairs_count') * 2),
                         output_field=FloatField()
                     )),
                default=Value(0.0),
                output_field=FloatField(),
            )
        ).order_by('-created_at')

        # Calculer les statistiques globales
        global_stats = Campaign.objects.filter(hr_manager=hr_manager).aggregate(
            total_pairs=Count('employeepair', distinct=True),
            total_employees=Count('employee', distinct=True),
            total_evaluations=Count(
                'employeepair__evaluation',
                filter=Q(employeepair__evaluation__used=True),
                distinct=True
            ),
            overall_rating=Avg(
                'employeepair__evaluation__rating',
                filter=Q(employeepair__evaluation__used=True)
            ),
            completed_campaigns=Count(
                'id',
                filter=Q(workflow_state__completed_steps__contains=[5])
            )
        )

        # Distribution des notes - calculée séparément
        rating_distribution = []
        for rating in range(1, 6):
            count = Evaluation.objects.filter(
                employee_pair__campaign__hr_manager=hr_manager,
                used=True,
                rating=rating
            ).count()
            rating_distribution.append({
                'rating': rating,
                'count': count
            })

        # Pagination manuelle pour plus de contrôle
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        # Récupérer le nombre total d'éléments
        total_items = base_queryset.count()

        # Extraire la page demandée
        campaigns = base_queryset[start_idx:end_idx]

        # Préparer la réponse
        data = []
        for campaign in campaigns:
            data.append({
                'id': campaign.id,
                'title': campaign.title,
                'description': campaign.description,
                'status': campaign.workflow_state.name if campaign.workflow_state else 'Unknown',
                'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                'end_date': campaign.end_date.isoformat() if campaign.end_date else None,
                'pairs_count': campaign.pairs_count,
                'employees_count': campaign.employees_count,
                'criteria_count': campaign.criteria_count,
                'evaluation_count': campaign.evaluation_count,
                'average_rating': round(campaign.average_rating, 1) if campaign.average_rating else 0,
                'response_rate': round(campaign.response_rate, 1) if campaign.response_rate else 0
            })

        return Response({
            'success': True,
            'data': {
                'campaigns': data,
                'global_stats': {
                    'total_pairs': global_stats['total_pairs'],
                    'total_employees': global_stats['total_employees'],
                    'total_evaluations': global_stats['total_evaluations'],
                    'overall_rating': round(global_stats['overall_rating'], 1) if global_stats['overall_rating'] else 0,
                    'completed_campaigns': global_stats['completed_campaigns'],
                },
                'rating_distribution': rating_distribution,
                'pagination': {
                    'total_items': total_items,
                    'page_size': page_size,
                    'current_page': page,
                    'total_pages': (total_items + page_size - 1) // page_size  # Calculate total pages
                }
            }
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@cache_dashboard_response(timeout=300)
def campaign_history(request):
    """
    Récupère l'historique des campagnes pour le manager RH authentifié
    avec pagination et optimisation des requêtes
    """
    try:
        hr_manager = request.user
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))

        # Base query avec annotations et gestion des doublons
        base_query = Campaign.objects.filter(
            hr_manager=hr_manager
        ).select_related(
            'workflow_state'
        )

        # Obtenir les IDs uniques des campagnes d'abord
        campaign_ids = base_query.values_list('id', flat=True).distinct()

        # Requête principale avec annotations, en utilisant les IDs uniques
        campaigns = Campaign.objects.filter(
            id__in=campaign_ids
        ).select_related(
            'workflow_state'
        ).annotate(
            participant_count=Count('employee', distinct=True),
            pair_count=Count('employeepair', distinct=True),
            evaluation_count=Count('employeepair__evaluation',
                                 filter=Q(employeepair__evaluation__used=True),
                                 distinct=True),
            avg_rating=Avg('employeepair__evaluation__rating',
                         filter=Q(employeepair__evaluation__used=True))
        ).order_by('-created_at')

        # Calculer la pagination
        total_items = len(campaign_ids)
        total_pages = (total_items + page_size - 1) // page_size

        # Paginer les résultats
        start = (page - 1) * page_size
        end = start + page_size
        page_campaigns = campaigns[start:end]

        # Statistiques globales
        evaluations_stats = Evaluation.objects.filter(
            employee_pair__campaign__hr_manager=hr_manager,
            used=True
        ).aggregate(
            overall_rating=Avg('rating'),
            total_evaluations=Count('id', distinct=True)
        )

        total_pairs = EmployeePair.objects.filter(
            campaign__hr_manager=hr_manager
        ).count()

        response_rate = (evaluations_stats['total_evaluations'] / (total_pairs * 2) * 100) if total_pairs > 0 else 0

        # Distribution des notes
        rating_distribution = []
        for rating in range(1, 6):
            count = Evaluation.objects.filter(
                employee_pair__campaign__hr_manager=hr_manager,
                used=True,
                rating=rating
            ).count()
            rating_distribution.append({
                'rating': rating,
                'count': count
            })

        # Préparer les données des campagnes
        campaigns_data = []
        for campaign in page_campaigns:
            campaign_response_rate = (campaign.evaluation_count / (campaign.pair_count * 2) * 100) if campaign.pair_count > 0 else 0

            campaign_data = {
                'id': campaign.id,
                'title': campaign.title,
                'description': campaign.description or '',
                'status': dict(CampaignWorkflowState.WORKFLOW_STEPS).get(
                    campaign.workflow_state.current_step if campaign.workflow_state else 1,
                    'Créer Campagne'
                ),
                'start_date': campaign.start_date.strftime('%Y-%m-%d') if campaign.start_date else None,
                'end_date': campaign.end_date.strftime('%Y-%m-%d') if campaign.end_date else None,
                'created_at': campaign.created_at.strftime('%Y-%m-%d %H:%M') if campaign.created_at else None,
                'participants': campaign.participant_count or 0,
                'pairs': campaign.pair_count or 0,
                'evaluations': campaign.evaluation_count or 0,
                'average_rating': round(campaign.avg_rating, 1) if campaign.avg_rating else 0,
                'response_rate': round(campaign_response_rate, 1)
            }
            campaigns_data.append(campaign_data)

        return Response({
            'success': True,
            'data': {
                'campaigns': campaigns_data,
                'statistics': {
                    'rating_distribution': rating_distribution,
                    'response_rate': round(response_rate, 1),
                    'overall_rating': round(evaluations_stats['overall_rating'], 1) if evaluations_stats['overall_rating'] else 0,
                    'total_evaluations': evaluations_stats['total_evaluations'] or 0,
                    'total_pairs': total_pairs
                },
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_items': total_items,
                    'page_size': page_size
                }
            }
        })

    except Exception as e:
        import traceback
        print(f"Error in campaign_history: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def campaign_history_trends(request):
    """
    Récupère l'évolution des évaluations sur les derniers mois
    """
    try:
        hr_manager = request.user
        months = int(request.GET.get('months', 6))

        # Calculer la période
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30 * months)

        # Récupérer les évaluations par mois
        evaluations = Evaluation.objects.filter(
            employee_pair__campaign__hr_manager=hr_manager,
            used=True,
            submitted_at__date__gte=start_date,
            submitted_at__date__lte=end_date
        ).annotate(
            month=TruncMonth('submitted_at')
        ).values('month').annotate(
            count=Count('id'),
            avg_rating=Avg('rating')
        ).order_by('month')

        # Formater les données pour le graphique
        trends_data = [{
            'date': eval['month'].strftime('%Y-%m'),
            'count': eval['count'],
            'average_rating': round(eval['avg_rating'], 1) if eval['avg_rating'] else 0
        } for eval in evaluations]

        return Response({
            'success': True,
            'data': trends_data
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_history_pdf(request):
    """
    Exporte l'historique des campagnes en PDF
    """
    try:
        hr_manager = request.user

        # Récupérer toutes les campagnes
        campaigns = Campaign.objects.filter(
            hr_manager=hr_manager
        ).select_related(
            'workflow_state'
        ).annotate(
            participant_count=Count('employee', distinct=True),
            pair_count=Count('employeepair', distinct=True),
            evaluation_count=Count('employeepair__evaluation', 
                                 filter=Q(employeepair__evaluation__used=True),
                                 distinct=True),
            avg_rating=Avg('employeepair__evaluation__rating',
                         filter=Q(employeepair__evaluation__used=True))
        ).order_by('-created_at')

        # Créer le PDF avec ReportLab
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="campaign_history.pdf"'
        # Ajout des entêtes CORS
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        # Créer le document PDF
        doc = SimpleDocTemplate(response, pagesize=landscape(A4))
        elements = []
        
        # Style du document
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        
        # Titre
        elements.append(Paragraph("Historique des Campagnes", title_style))
        elements.append(Spacer(1, 20))
        
        # Données du tableau
        data = [['Campagne', 'Statut', 'Date début', 'Date fin', 'Participants', 'Paires', 'Évaluations', 'Note moyenne', 'Taux réponse']]
        for campaign in campaigns:
            response_rate = (campaign.evaluation_count / (campaign.pair_count * 2) * 100) if campaign.pair_count > 0 else 0
            data.append([
                campaign.title,
                dict(CampaignWorkflowState.WORKFLOW_STEPS).get(
                    campaign.workflow_state.current_step if campaign.workflow_state else 1,
                    'Créer Campagne'
                ),
                campaign.start_date.strftime('%Y-%m-%d') if campaign.start_date else '-',
                campaign.end_date.strftime('%Y-%m-%d') if campaign.end_date else '-',
                str(campaign.participant_count),
                str(campaign.pair_count),
                str(campaign.evaluation_count),
                f"{round(campaign.avg_rating, 1)}/5" if campaign.avg_rating else '-',
                f"{round(response_rate, 1)}%" if campaign.pair_count > 0 else '-'
            ])
        
        # Créer le tableau
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWHEIGHT', (0, 0), (-1, -1), 30),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(table)
        
        # Ajouter les statistiques globales
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("Statistiques Globales", title_style))
        elements.append(Spacer(1, 20))
        
        # Calculer les statistiques globales
        total_participants = sum(c.participant_count for c in campaigns)
        total_pairs = sum(c.pair_count for c in campaigns)
        total_evaluations = sum(c.evaluation_count for c in campaigns)
        avg_rating = sum(c.avg_rating * c.evaluation_count if c.avg_rating else 0 for c in campaigns) / (total_evaluations if total_evaluations > 0 else 1)
        global_response_rate = (total_evaluations / (total_pairs * 2) * 100) if total_pairs > 0 else 0
        
        stats_data = [
            ['Total Participants', 'Total Paires', 'Total Évaluations', 'Note Moyenne', 'Taux de Réponse Global'],
            [
                str(total_participants),
                str(total_pairs),
                str(total_evaluations),
                f"{round(avg_rating, 1)}/5",
                f"{round(global_response_rate, 1)}%"
            ]
        ]
        
        stats_table = Table(stats_data, repeatRows=1)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWHEIGHT', (0, 0), (-1, -1), 30),
        ]))
        
        elements.append(stats_table)
        doc.build(elements)
        
        return response
        
    except Exception as e:
        import traceback
        print(f"Error in export_history_pdf: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
