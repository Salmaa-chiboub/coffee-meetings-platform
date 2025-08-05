from django.urls import path
from . import views

urlpatterns = [
    path('statistics/', views.dashboard_statistics, name='dashboard_statistics'),
    path('recent-evaluations/', views.recent_evaluations, name='recent_evaluations'),
    path('rating-distribution/', views.rating_distribution, name='rating_distribution'),
    path('evaluation-trends/', views.evaluation_trends, name='evaluation_trends'),
    path('overview/', views.dashboard_overview, name='dashboard_overview'),
    path('campaign-history/', views.campaign_history, name='campaign_history'),
    path('campaign-history-stats/', views.campaign_history_statistics, name='campaign_history_statistics'),
    path('campaign-history/trends/', views.campaign_history_trends, name='campaign_history_trends'),
    path('campaign-history/export-pdf/', views.export_history_pdf, name='export_history_pdf'),
]
