from rest_framework import serializers
from .models import Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    """Full serializer for HR managers"""
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    partner_name = serializers.SerializerMethodField()
    campaign_title = serializers.CharField(source='employee_pair.campaign.title', read_only=True)

    class Meta:
        model = Evaluation
        fields = '__all__'

    def get_partner_name(self, obj):
        """Get the name of the coffee meeting partner"""
        if obj.employee_pair:
            if obj.employee == obj.employee_pair.employee1:
                return obj.employee_pair.employee2.name
            else:
                return obj.employee_pair.employee1.name
        return None


class EvaluationFormSerializer(serializers.ModelSerializer):
    """Serializer for displaying evaluation form (public access)"""
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    partner_name = serializers.SerializerMethodField()
    campaign_title = serializers.CharField(source='employee_pair.campaign.title', read_only=True)
    campaign_dates = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = [
            'employee_name', 'partner_name', 'campaign_title',
            'campaign_dates', 'rating', 'comment'
        ]
        read_only_fields = ['employee_name', 'partner_name', 'campaign_title', 'campaign_dates']

    def get_partner_name(self, obj):
        """Get the name of the coffee meeting partner"""
        if obj.employee_pair:
            if obj.employee == obj.employee_pair.employee1:
                return obj.employee_pair.employee2.name
            else:
                return obj.employee_pair.employee1.name
        return None

    def get_campaign_dates(self, obj):
        """Get campaign date range"""
        if obj.employee_pair and obj.employee_pair.campaign:
            campaign = obj.employee_pair.campaign
            return {
                'start_date': campaign.start_date,
                'end_date': campaign.end_date
            }
        return None


class EvaluationSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for submitting evaluation (public access)"""

    class Meta:
        model = Evaluation
        fields = ['rating', 'comment']

    def validate_rating(self, value):
        """Validate rating is between 1 and 5"""
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def validate(self, data):
        """Ensure at least rating or comment is provided"""
        if not data.get('rating') and not data.get('comment'):
            raise serializers.ValidationError(
                "Please provide either a rating or a comment (or both)"
            )
        return data


class CampaignEvaluationResultsSerializer(serializers.ModelSerializer):
    """Serializer for campaign evaluation results (HR access)"""
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    partner_name = serializers.SerializerMethodField()
    pair_id = serializers.IntegerField(source='employee_pair.id', read_only=True)

    class Meta:
        model = Evaluation
        fields = [
            'id', 'employee_name', 'partner_name', 'pair_id',
            'rating', 'comment', 'submitted_at'
        ]

    def get_partner_name(self, obj):
        """Get the name of the coffee meeting partner"""
        if obj.employee_pair:
            if obj.employee == obj.employee_pair.employee1:
                return obj.employee_pair.employee2.name
            else:
                return obj.employee_pair.employee1.name
        return None
