from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, EmployeeAttributeViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'attributes', EmployeeAttributeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
