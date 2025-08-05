# campaigns/serializers.py
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Prefetch
from .models import Campaign, CampaignWorkflowState, CampaignWorkflowLog

class CampaignWorkflowStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignWorkflowState
        fields = ['current_step', 'completed_steps', 'step_data', 'updated_at']

class CampaignAggregatedSerializer(serializers.ModelSerializer):
    workflow_state = CampaignWorkflowStateSerializer(read_only=True)
    employee_count = serializers.IntegerField(read_only=True)
    pairs_count = serializers.IntegerField(read_only=True)
    total_criteria = serializers.SerializerMethodField()
    
    def get_total_criteria(self, obj):
        return obj.campaignmatchingcriteria_set.count()
    
    class Meta:
        model = Campaign
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'created_at', 'workflow_state', 'employee_count', 'pairs_count',
            'total_criteria'
        ]

class CampaignSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    employees_count = serializers.SerializerMethodField()  # Alias pour compatibilité frontend
    total_criteria = serializers.SerializerMethodField()
    
    def get_total_criteria(self, obj):
        return obj.campaignmatchingcriteria_set.count()

    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ['created_at', 'hr_manager']

    def get_employee_count(self, obj):
        """Get employee count efficiently"""
        # Use annotated count if available (from ViewSet annotation)
        if hasattr(obj, 'employee_count'):
            return obj.employee_count

        # Fallback: count employees directly
        from employees.models import Employee
        return Employee.objects.filter(campaign=obj).count()

    def get_employees_count(self, obj):
        """Alias pour get_employee_count pour compatibilité frontend"""
        return self.get_employee_count(obj)

    def validate(self, data):
        """Validation personnalisée pour les dates"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # Si on est en mode update, récupérer les dates existantes si elles ne sont pas fournies
        if self.instance:
            start_date = start_date or self.instance.start_date
            end_date = end_date or self.instance.end_date

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError({
                    'end_date': 'La date de fin doit être postérieure à la date de début.'
                })

        return data

    def create(self, validated_data):
        """Création d'une campagne avec gestion des erreurs de validation"""
        try:
            return super().create(validated_data)
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                raise serializers.ValidationError(e.message_dict)
            else:
                raise serializers.ValidationError({'non_field_errors': [str(e)]})

    def update(self, instance, validated_data):
        # Retirer les dates des données mises à jour pour les protéger
        validated_data.pop('start_date', None)
        validated_data.pop('end_date', None)

        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as e:
            # Convertir les erreurs de validation Django en erreurs DRF
            if hasattr(e, 'message_dict'):
                raise serializers.ValidationError(e.message_dict)
            else:
                raise serializers.ValidationError({'non_field_errors': [str(e)]})


# Workflow Serializers
class CampaignWorkflowStateSerializer(serializers.ModelSerializer):
    """
    Serializer for CampaignWorkflowState
    """
    campaign_id = serializers.IntegerField(source='campaign.id', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)

    class Meta:
        model = CampaignWorkflowState
        fields = [
            'id',
            'campaign_id',
            'campaign_title',
            'current_step',
            'completed_steps',
            'step_data',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkflowStepUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating workflow step completion
    """
    step = serializers.IntegerField(min_value=1, max_value=5)
    completed = serializers.BooleanField(default=True)
    data = serializers.JSONField(required=False, default=dict)

    def validate_step(self, value):
        """Validate step number"""
        if value not in [1, 2, 3, 4, 5]:
            raise serializers.ValidationError("Step must be between 1 and 5")
        return value


class WorkflowValidationSerializer(serializers.Serializer):
    """
    Serializer for workflow step validation response
    """
    step = serializers.IntegerField()
    can_access = serializers.BooleanField()
    is_completed = serializers.BooleanField()
    errors = serializers.ListField(child=serializers.CharField(), default=list)
    warnings = serializers.ListField(child=serializers.CharField(), default=list)


class CampaignWorkflowLogSerializer(serializers.ModelSerializer):
    """
    Serializer for CampaignWorkflowLog
    """
    campaign_id = serializers.IntegerField(source='campaign.id', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)

    class Meta:
        model = CampaignWorkflowLog
        fields = [
            'id',
            'campaign_id',
            'campaign_title',
            'step_number',
            'action',
            'user',
            'data',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']