from django.urls import path
from .views import (
    AvailableAttributesView, SaveMatchingCriteriaView, GeneratePairsView,
    ConfirmPairsView, MatchingHistoryView, CriteriaHistoryView
)

# ============================================================================
# STREAMLINED MATCHING API URLS - WORKFLOW-DRIVEN ENDPOINTS
# ============================================================================

urlpatterns = [
    # Step 1: Get available attributes for criteria definition
    path(
        'campaigns/<int:campaign_id>/available-attributes/',
        AvailableAttributesView.as_view(),
        name='matching-available-attributes'
    ),

    # Step 2: Save matching criteria
    path(
        'campaigns/<int:campaign_id>/criteria/',
        SaveMatchingCriteriaView.as_view(),
        name='matching-save-criteria'
    ),

    # Step 3: Generate pairs based on criteria
    path(
        'campaigns/<int:campaign_id>/generate-pairs/',
        GeneratePairsView.as_view(),
        name='matching-generate-pairs'
    ),

    # Step 4: Confirm and save selected pairs
    path(
        'campaigns/<int:campaign_id>/confirm-pairs/',
        ConfirmPairsView.as_view(),
        name='matching-confirm-pairs'
    ),

    # Step 5: Get complete matching history
    path(
        'campaigns/<int:campaign_id>/history/',
        MatchingHistoryView.as_view(),
        name='matching-history'
    ),

    # Step 6: Get criteria history
    path(
        'campaigns/<int:campaign_id>/criteria-history/',
        CriteriaHistoryView.as_view(),
        name='matching-criteria-history'
    ),
]
