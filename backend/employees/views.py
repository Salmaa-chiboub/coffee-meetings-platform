from rest_framework import viewsets
from .models import Employee, EmployeeAttribute
from .serializers import EmployeeSerializer, EmployeeAttributeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class EmployeeAttributeViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAttribute.objects.all()
    serializer_class = EmployeeAttributeSerializer
