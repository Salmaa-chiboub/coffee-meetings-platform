from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Employee, EmployeeAttribute
from campaigns.models import Campaign

class EmployeeAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAttribute
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    attributes = EmployeeAttributeSerializer(source='employeeattribute_set', many=True, read_only=True)
    attributes_dict = serializers.SerializerMethodField()
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'name', 'email', 'arrival_date', 'campaign', 'campaign_title',
                 'attributes', 'attributes_dict']

    def get_attributes_dict(self, obj):
        """Return employee attributes as a flat dictionary"""
        return obj.get_attributes_dict()

class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating employees with attributes"""
    attributes = serializers.DictField(child=serializers.CharField(), required=False)

    class Meta:
        model = Employee
        fields = ['name', 'email', 'arrival_date', 'campaign', 'attributes']

    def create(self, validated_data):
        attributes_data = validated_data.pop('attributes', {})
        employee = Employee.objects.create(**validated_data)

        # Create attributes
        for key, value in attributes_data.items():
            EmployeeAttribute.objects.create(
                employee=employee,
                campaign=employee.campaign,
                attribute_key=key,
                attribute_value=str(value)
            )

        return employee

class ExcelUploadSerializer(serializers.Serializer):
    """Serializer for Excel file upload"""
    file = serializers.FileField()
    campaign_id = serializers.IntegerField()
    replace_existing = serializers.BooleanField(default=False, required=False)

    def validate_file(self, value):
        """Validate uploaded file"""
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError("File must be an Excel file (.xlsx or .xls)")

        # Check file size (25MB limit)
        if value.size > 25 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 25MB")

        return value

    def validate_campaign_id(self, value):
        """Validate campaign exists"""
        try:
            Campaign.objects.get(id=value)
        except Campaign.DoesNotExist:
            raise serializers.ValidationError("Campaign does not exist")

        return value

class BulkEmployeeSerializer(serializers.Serializer):
    """Serializer for bulk employee operations"""
    employees = EmployeeCreateSerializer(many=True)
    campaign_id = serializers.IntegerField()

class ExcelProcessingResultSerializer(serializers.Serializer):
    """Serializer for Excel processing results"""
    success = serializers.BooleanField()
    total_rows = serializers.IntegerField()
    processed_rows = serializers.IntegerField()
    created_employees = serializers.IntegerField()
    deleted_employees = serializers.IntegerField(required=False)
    errors = serializers.ListField(child=serializers.DictField(), required=False)
    employees = EmployeeSerializer(many=True, required=False)
