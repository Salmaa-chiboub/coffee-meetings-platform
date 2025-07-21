from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignMatchingCriteriaViewSet, EmployeePairViewSet

router = DefaultRouter()
router.register(r'criteria', CampaignMatchingCriteriaViewSet)
router.register(r'pairs', EmployeePairViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
