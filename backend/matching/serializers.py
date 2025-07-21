from rest_framework import serializers
from .models import CampaignMatchingCriteria, EmployeePair

class CampaignMatchingCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignMatchingCriteria
        fields = '__all__'

class EmployeePairSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeePair
        fields = '__all__'
