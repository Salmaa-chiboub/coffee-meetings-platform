from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import HRManager

class Campaign(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    hr_manager = models.ForeignKey(HRManager, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['hr_manager', 'created_at']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['hr_manager', 'start_date']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def clean(self):
        """Validation personnalisée pour s'assurer que end_date > start_date"""
        super().clean()
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError({
                    'end_date': 'La date de fin doit être postérieure à la date de début.'
                })

    def save(self, *args, **kwargs):
        # Validation complète avant sauvegarde
        self.full_clean()

        if self.pk:
            old = Campaign.objects.get(pk=self.pk)
            # Interdire toute modification des dates après création
            if self.start_date != old.start_date or self.end_date != old.end_date:
                raise ValidationError("La modification des dates n'est pas autorisée après création.")
        super().save(*args, **kwargs)

    def is_completed(self):
        """Vérifie si la campagne est complétée (étape 5 terminée)"""
        try:
            workflow_state = self.workflow_state
            return 5 in workflow_state.completed_steps
        except CampaignWorkflowState.DoesNotExist:
            return False

    def can_be_deleted(self):
        """Vérifie si la campagne peut être supprimée"""
        return not self.is_completed()


class CampaignWorkflowState(models.Model):
    """
    Tracks the workflow state for each campaign
    """
    WORKFLOW_STEPS = [
        (1, 'Créer Campagne'),
        (2, 'Télécharger Employés'),
        (3, 'Définir Critères'),
        (4, 'Générer Paires'),
        (5, 'Confirmer et Envoyer'),
    ]

    campaign = models.OneToOneField(Campaign, on_delete=models.CASCADE, related_name='workflow_state')
    current_step = models.IntegerField(choices=WORKFLOW_STEPS, default=1)
    completed_steps = models.JSONField(default=list)  # List of completed step numbers
    step_data = models.JSONField(default=dict)  # Data for each step

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaign_workflow_state'

    def __str__(self):
        return f"Workflow for {self.campaign.title} - Step {self.current_step}"

    def mark_step_completed(self, step_number, step_data=None):
        """Mark a step as completed"""
        if step_number not in self.completed_steps:
            self.completed_steps.append(step_number)
            self.completed_steps.sort()

        if step_data:
            self.step_data[str(step_number)] = step_data

        # Update current step logic
        if step_number == 5:
            # If step 5 is completed, stay on step 5 (campaign completed)
            self.current_step = 5
        else:
            # For other steps, move to next step
            self.current_step = max(self.completed_steps) + 1 if self.completed_steps else 1
            self.current_step = min(self.current_step, 5)  # Max step is 5

        self.save()

    def mark_step_incomplete(self, step_number):
        """Mark a step as incomplete"""
        if step_number in self.completed_steps:
            self.completed_steps.remove(step_number)

        # Remove step data
        if str(step_number) in self.step_data:
            del self.step_data[str(step_number)]

        # Update current step
        self.current_step = max(self.completed_steps) + 1 if self.completed_steps else 1
        self.current_step = min(self.current_step, step_number)

        self.save()

    def reset_from_step(self, from_step):
        """Reset workflow from a specific step onwards"""
        # Remove all completed steps >= from_step
        self.completed_steps = [step for step in self.completed_steps if step < from_step]

        # Remove step data for steps >= from_step
        steps_to_remove = [str(step) for step in range(from_step, 6)]
        for step_key in steps_to_remove:
            if step_key in self.step_data:
                del self.step_data[step_key]

        # Update current step
        self.current_step = from_step
        self.save()

    def can_access_step(self, step_number):
        """Check if a step can be accessed based on dependencies"""
        step_dependencies = {
            1: [],  # Créer Campagne - no dependencies
            2: [1],  # Télécharger Employés - requires campaign creation
            3: [1, 2],  # Définir Critères - requires campaign and employees
            4: [1, 2],  # Générer Paires - requires campaign and employees (criteria optional)
            5: [1, 2, 4],  # Confirmer et Envoyer - requires campaign, employees, and generated pairs
        }

        required_steps = step_dependencies.get(step_number, [])
        return all(step in self.completed_steps for step in required_steps)

    def get_step_validation_errors(self, step_number):
        """Get validation errors for a specific step"""
        errors = []

        # Check dependencies
        if not self.can_access_step(step_number):
            step_dependencies = {
                1: [],
                2: [1],
                3: [1, 2],
                4: [1, 2],
                5: [1, 2, 4],
            }
            required_steps = step_dependencies.get(step_number, [])
            missing_steps = [step for step in required_steps if step not in self.completed_steps]

            if missing_steps:
                step_names = {
                    1: 'Créer Campagne',
                    2: 'Télécharger Employés',
                    3: 'Définir Critères',
                    4: 'Générer Paires',
                    5: 'Confirmer et Envoyer'
                }
                missing_names = [step_names.get(step, f'Step {step}') for step in missing_steps]
                errors.append(f"Please complete the following steps first: {', '.join(missing_names)}")

        # Step-specific validation
        if step_number == 2:  # Télécharger Employés
            step_data = self.step_data.get('2', {})
            if not step_data.get('employees_count') or step_data.get('employees_count', 0) < 2:
                errors.append("Au moins 2 employés sont requis pour l'appariement")

        elif step_number == 4:  # Générer Paires
            step_data = self.step_data.get('4', {})
            if not step_data.get('pairs_count') or step_data.get('pairs_count', 0) == 0:
                errors.append("Aucune paire n'a été générée")

        elif step_number == 5:  # Confirmer et Envoyer
            step_data = self.step_data.get('5', {})
            if not step_data.get('confirmed_pairs') or step_data.get('confirmed_pairs', 0) == 0:
                errors.append("No pairs have been confirmed")

        return errors


class CampaignWorkflowLog(models.Model):
    """
    Logs workflow actions for audit trail
    """
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='workflow_logs')
    step_number = models.IntegerField()
    action = models.CharField(max_length=50)  # 'completed', 'reset', 'accessed', etc.
    user = models.CharField(max_length=100, blank=True)  # User who performed the action
    data = models.JSONField(default=dict)  # Additional data about the action
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'campaign_workflow_log'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.campaign.title} - Step {self.step_number} - {self.action}"
