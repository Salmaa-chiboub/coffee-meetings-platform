from rest_framework import serializers
from .models import HRManager

class HRManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRManager
        fields = '__all__'
