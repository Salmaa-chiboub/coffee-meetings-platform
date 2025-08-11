from rest_framework import serializers
from django.utils import timezone
from .models import CampaignMatchingCriteria, EmployeePair
from employees.models import Employee, EmployeeAttribute
from campaigns.models import Campaign


class CampaignMatchingCriteriaSerializer(serializers.ModelSerializer):
    """Serializer for campaign matching criteria"""

    class Meta:
        model = CampaignMatchingCriteria
        fields = ['id', 'campaign', 'attribute_key', 'rule', 'created_at', 'created_by', 'is_locked']
        read_only_fields = ['id', 'created_at', 'is_locked']

    def validate(self, data):
        """Validate criteria data"""
        campaign = data.get('campaign')
        attribute_key = data.get('attribute_key')

        # Check if campaign exists and has employees with this attribute
        if campaign and attribute_key:
            if not EmployeeAttribute.objects.filter(
                campaign=campaign,
                attribute_key=attribute_key
            ).exists():
                raise serializers.ValidationError(
                    f"No employees in this campaign have the attribute '{attribute_key}'"
                )

        return data


class EmployeeBasicSerializer(serializers.ModelSerializer):
    """Basic employee serializer for pair responses"""

    class Meta:
        model = Employee
        fields = ['id', 'name', 'email']


class EmployeePairSerializer(serializers.ModelSerializer):
    """Enhanced serializer for employee pairs with complete information"""
    employee1 = EmployeeBasicSerializer(read_only=True)
    employee2 = EmployeeBasicSerializer(read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    email_status_display = serializers.CharField(source='get_email_status_display', read_only=True)

    class Meta:
        model = EmployeePair
        fields = [
            'id', 'campaign', 'campaign_title', 'employee1', 'employee2',
            'email_status', 'email_status_display', 'email_sent_at', 'email_error_message',
            'email_sent', 'created_at', 'created_by', 'matching_criteria_snapshot'
        ]
        read_only_fields = [
            'id', 'created_at', 'email_sent_at', 'email_status_display', 'campaign_title'
        ]


class AvailableAttributesSerializer(serializers.Serializer):
    """Serializer for available attributes response"""
    available_attributes = serializers.ListField(child=serializers.CharField())
    total_count = serializers.IntegerField()
    campaign_id = serializers.IntegerField()


class CriteriaSaveRequestSerializer(serializers.Serializer):
    """Serializer for saving matching criteria"""
    criteria = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        min_length=1
    )

    def validate_criteria(self, value):
        """Validate criteria format"""
        for criterion in value:
            if 'attribute_key' not in criterion or 'rule' not in criterion:
                raise serializers.ValidationError(
                    "Each criterion must have 'attribute_key' and 'rule' fields"
                )

            if criterion['rule'] not in ['same', 'not_same']:
                raise serializers.ValidationError(
                    "Rule must be either 'same' or 'not_same'"
                )

        return value


class CriteriaSaveResponseSerializer(serializers.Serializer):
    """Serializer for criteria save response"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    criteria_saved = serializers.ListField(child=serializers.DictField())
    total_saved = serializers.IntegerField()


class PairGenerationResponseSerializer(serializers.Serializer):
    """Serializer for pair generation response"""
    success = serializers.BooleanField()
    pairs = serializers.ListField(child=serializers.DictField())
    total_possible = serializers.IntegerField()
    total_generated = serializers.IntegerField()
    criteria_used = serializers.ListField(child=serializers.DictField())
    existing_pairs_count = serializers.IntegerField()
    message = serializers.CharField()
    error = serializers.CharField(required=False)


class PairConfirmationRequestSerializer(serializers.Serializer):
    """Serializer for pair confirmation request"""
    pairs = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        ),
        min_length=1
    )
    send_emails = serializers.BooleanField(default=True)

    def validate_pairs(self, value):
        """Validate pairs format"""
        for pair in value:
            if 'employee_1_id' not in pair or 'employee_2_id' not in pair:
                raise serializers.ValidationError(
                    "Each pair must have 'employee_1_id' and 'employee_2_id' fields"
                )

            if pair['employee_1_id'] == pair['employee_2_id']:
                raise serializers.ValidationError(
                    "Employee cannot be paired with themselves"
                )

        return value


class PairConfirmationResponseSerializer(serializers.Serializer):
    """Serializer for pair confirmation response"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    pairs_saved = serializers.ListField(child=serializers.DictField())
    total_saved = serializers.IntegerField()
    email_results = serializers.DictField(required=False)
    errors = serializers.ListField(child=serializers.CharField(), required=False)


class MatchingHistorySerializer(serializers.Serializer):
    """Serializer for matching history response"""
    campaign_id = serializers.IntegerField()
    campaign_title = serializers.CharField()
    total_pairs = serializers.IntegerField()
    pairs = EmployeePairSerializer(many=True)
    criteria_history = CampaignMatchingCriteriaSerializer(many=True)
    email_summary = serializers.DictField()
    last_generation_date = serializers.DateTimeField(required=False)


class CriteriaHistorySerializer(serializers.Serializer):
    """Serializer for criteria history response"""
    campaign_id = serializers.IntegerField()
    campaign_title = serializers.CharField()
    criteria = CampaignMatchingCriteriaSerializer(many=True)
    total_criteria = serializers.IntegerField()
    is_locked = serializers.BooleanField()
    pairs_generated = serializers.IntegerField()
