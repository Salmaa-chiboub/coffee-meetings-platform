from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EvaluationFormView,
    EvaluationSubmissionView,
    CampaignEvaluationResultsView,
    EvaluationStatisticsView
)


urlpatterns = [
    # Public evaluation endpoints (no authentication required)
    path('evaluate/<uuid:token>/', EvaluationFormView.as_view(), name='evaluation-form'),
    path('evaluate/<uuid:token>/submit/', EvaluationSubmissionView.as_view(), name='evaluation-submit'),

    # Protected RH endpoints (authentication required - 3 endpoints)
    path('campaigns/<int:campaign_id>/evaluations/', CampaignEvaluationResultsView.as_view(), name='rh-campaign-evaluations'),
    path('campaigns/<int:campaign_id>/statistics/', EvaluationStatisticsView.as_view(), name='rh-campaign-statistics'),
]

# PUBLIC ENDPOINTS (no authentication):
# GET /evaluations/evaluate/{token}/ - Display evaluation form
# POST /evaluations/evaluate/{token}/submit/ - Submit evaluation

# PROTECTED RH ENDPOINTS (authentication required - 2 endpoints only):
# GET /evaluations/campaigns/{id}/evaluations/ - List evaluations for campaign
# GET /evaluations/campaigns/{id}/statistics/ - Statistics for campaign

# Note: RH users can only view data, no creation/modification allowed
