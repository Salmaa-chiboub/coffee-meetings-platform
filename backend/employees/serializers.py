from rest_framework import serializers
from .models import Employee, EmployeeAttribute

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

class EmployeeAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAttribute
        fields = '__all__'
