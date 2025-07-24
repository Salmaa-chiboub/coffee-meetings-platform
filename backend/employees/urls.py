from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, EmployeeAttributeViewSet

# Router pour les employés
employee_router = DefaultRouter()
employee_router.register(r'', EmployeeViewSet, basename='employee')

urlpatterns = [
    # Routes explicites pour les attributs
    path('attributes/', EmployeeAttributeViewSet.as_view({'get': 'list', 'post': 'create'}), name='employeeattribute-list'),
    path('attributes/<int:pk>/', EmployeeAttributeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='employeeattribute-detail'),

    # Routes pour les employés (doivent être après les routes spécifiques)
    path('', include(employee_router.urls)),
]

# Available endpoints:
# EMPLOYEE ENDPOINTS:
# GET /employees/ - List all employees (with filtering by campaign)
# POST /employees/ - Create a new employee
# GET /employees/{id}/ - Get specific employee details
# PUT/PATCH /employees/{id}/ - Update employee information
# DELETE /employees/{id}/ - Delete specific employee
# POST /employees/upload-excel/ - Upload and process Excel file (with replace option)
# GET /employees/by-campaign/?campaign_id={id} - Get employees by campaign
# DELETE /employees/delete-by-campaign/?campaign_id={id} - Delete all employees from campaign
#
# ATTRIBUTE ENDPOINTS:
# GET /employees/attributes/ - List all employee attributes
# POST /employees/attributes/ - Create a new attribute
# GET /employees/attributes/{id}/ - Get specific attribute
# PUT/PATCH /employees/attributes/{id}/ - Update attribute
# DELETE /employees/attributes/{id}/ - Delete attribute
