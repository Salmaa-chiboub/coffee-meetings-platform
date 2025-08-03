# campaigns/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CampaignViewSet,
    CampaignWorkflowStatusView,
    CampaignWorkflowStepUpdateView,
    CampaignWorkflowValidationView,
    CampaignWorkflowResetView,
    CompletedCampaignsView
)

router = DefaultRouter()
router.register(r'', CampaignViewSet, basename='campaign')

# Workflow URLs
workflow_urlpatterns = [
    path('<int:campaign_id>/workflow-status/', CampaignWorkflowStatusView.as_view(), name='campaign-workflow-status'),
    path('<int:campaign_id>/workflow-step/', CampaignWorkflowStepUpdateView.as_view(), name='campaign-workflow-step'),
    path('<int:campaign_id>/workflow-validate/<int:step>/', CampaignWorkflowValidationView.as_view(), name='campaign-workflow-validate'),
    path('<int:campaign_id>/workflow-reset/', CampaignWorkflowResetView.as_view(), name='campaign-workflow-reset'),
]

urlpatterns = router.urls + workflow_urlpatterns + [
    path('completed/', CompletedCampaignsView.as_view(), name='completed-campaigns'),
]
