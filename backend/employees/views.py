from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Employee, EmployeeAttribute
from .serializers import EmployeeSerializer, EmployeeAttributeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

class EmployeeAttributeViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAttribute.objects.all()
    serializer_class = EmployeeAttributeSerializer
    permission_classes = [IsAuthenticated]
