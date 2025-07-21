from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HRManagerViewSet

router = DefaultRouter()
router.register(r'hr', HRManagerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
