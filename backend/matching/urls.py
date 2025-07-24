from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignMatchingCriteriaViewSet, EmployeePairViewSet
from .views import AvailableAttributesView , GeneratePairsView,ConfirmPairsView,SaveMatchingCriteriaView


router = DefaultRouter()
router.register(r'criteria', CampaignMatchingCriteriaViewSet)  # /matching/criteria/
router.register(r'pairs', EmployeePairViewSet)  # /matching/pairs/

urlpatterns = [
    path('', include(router.urls)), # /matching/
    path('available-attributes/', AvailableAttributesView.as_view(), name='available-attributes'),
    path('save-criteria/<int:campaign_id>/',  SaveMatchingCriteriaView.as_view(), name='save-matching-criteria'),
    path('generate-pairs/<int:campaign_id>/', GeneratePairsView.as_view(), name='generate-pairs'),
    path('confirm-pairs/<int:campaign_id>/', ConfirmPairsView.as_view(), name='confirm-pairs'),



]
