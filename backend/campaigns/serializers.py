# campaigns/serializers.py
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Campaign

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ['created_at', 'hr_manager']

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