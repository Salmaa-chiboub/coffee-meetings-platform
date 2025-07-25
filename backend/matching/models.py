from django.db import models
from django.utils import timezone
from campaigns.models import Campaign
from employees.models import Employee


class CampaignMatchingCriteria(models.Model):
    """
    Stores matching criteria for a campaign.
    Once pairs are generated, criteria become immutable.
    """
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, null=True, blank=True)
    attribute_key = models.CharField(max_length=100)
    RULE_CHOICES = [
        ('same', 'Same'),
        ('not_same', 'Not Same'),
    ]
    rule = models.CharField(max_length=20, choices=RULE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, blank=True)  # HR manager identifier
    is_locked = models.BooleanField(default=False)  # Locked when pairs are generated

    class Meta:
        unique_together = ('campaign', 'attribute_key')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['campaign', 'created_at']),
        ]

    def __str__(self):
        return f"{self.campaign.title} - {self.attribute_key}: {self.rule}"

    def lock_criteria(self):
        """Lock criteria to prevent modification after pair generation"""
        self.is_locked = True
        self.save(update_fields=['is_locked'])


class EmployeePair(models.Model):
    """
    Stores employee pairs with comprehensive audit trail and email tracking.
    """
    EMAIL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('bounced', 'Bounced'),
    ]

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, null=True, blank=True)
    employee1 = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='pairs_as_employee1', null=True, blank=True)
    employee2 = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='pairs_as_employee2', null=True, blank=True)

    # Email tracking
    email_status = models.CharField(max_length=20, choices=EMAIL_STATUS_CHOICES, default='pending')
    email_sent_at = models.DateTimeField(null=True, blank=True)
    email_error_message = models.TextField(blank=True)

    # Audit trail
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, blank=True)  # HR manager identifier
    matching_criteria_snapshot = models.JSONField(null=True, blank=True)  # Criteria used for this pair

    # Legacy field for backward compatibility
    email_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['campaign', 'created_at']),
            models.Index(fields=['email_status']),
            models.Index(fields=['employee1', 'employee2']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['campaign', 'employee1', 'employee2'],
                name='unique_pair_forward'
            ),
            models.UniqueConstraint(
                fields=['campaign', 'employee2', 'employee1'],
                name='unique_pair_reverse'
            ),
        ]

    def __str__(self):
        return f"{self.employee1.name} & {self.employee2.name} ({self.campaign.title})"

    def mark_email_sent(self):
        """Mark email as successfully sent"""
        self.email_status = 'sent'
        self.email_sent_at = timezone.now()
        self.email_sent = True  # Legacy field
        self.email_error_message = ''
        self.save(update_fields=['email_status', 'email_sent_at', 'email_sent', 'email_error_message'])

    def mark_email_failed(self, error_message=''):
        """Mark email as failed with optional error message"""
        self.email_status = 'failed'
        self.email_error_message = error_message
        self.save(update_fields=['email_status', 'email_error_message'])

    def mark_email_bounced(self):
        """Mark email as bounced"""
        self.email_status = 'bounced'
        self.save(update_fields=['email_status'])

    @classmethod
    def pair_exists(cls, campaign, employee1, employee2):
        """Check if a pair already exists (in either direction)"""
        return cls.objects.filter(
            campaign=campaign
        ).filter(
            models.Q(employee1=employee1, employee2=employee2) |
            models.Q(employee1=employee2, employee2=employee1)
        ).exists()

    def get_partner(self, employee):
        """Get the partner of a given employee in this pair"""
        if self.employee1 == employee:
            return self.employee2
        elif self.employee2 == employee:
            return self.employee1
        return None
