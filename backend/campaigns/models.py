from django.db import models
from django.core.exceptions import ValidationError
from users.models import HRManager

class Campaign(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    hr_manager = models.ForeignKey(HRManager, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

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
