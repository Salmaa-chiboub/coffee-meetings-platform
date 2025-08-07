from django.db import models
from users.models import HRManager
from django.utils import timezone
import uuid




class Notification(models.Model):
    """
    Notification model for the CoffeeMeet platform
    """
    
    # Notification types
    TYPE_CHOICES = [
        ('campaign', 'Campaign'),
        ('evaluation', 'Evaluation'),
        ('system', 'System'),
        ('user', 'User'),
    ]
    
    # Priority levels
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        HRManager,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="HRManager who will receive this notification"
    )
    
    # Notification content
    title = models.CharField(max_length=255, help_text="Notification title")
    message = models.TextField(help_text="Notification message content")
    type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES, 
        default='system',
        help_text="Type of notification"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='low',
        help_text="Priority level of the notification"
    )
    
    # Status and metadata
    is_read = models.BooleanField(default=False, help_text="Whether the notification has been read")
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True, help_text="When the notification was read")
    
    # Optional related objects
    related_object_type = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text="Type of related object (e.g., 'campaign', 'employee')"
    )
    related_object_id = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="ID of the related object"
    )
    
    # Additional data (JSON field for flexible data storage)
    extra_data = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Additional data for the notification"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.email}"
    
    def mark_as_read(self):
        """Mark the notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_unread(self):
        """Mark the notification as unread"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])
    
    @property
    def time_since_created(self):
        """Get human-readable time since creation"""
        now = timezone.now()
        diff = now - self.created_at
        
        if diff.days > 0:
            return f"Il y a {diff.days} jour{'s' if diff.days > 1 else ''}"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"Il y a {hours} heure{'s' if hours > 1 else ''}"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"Il y a {minutes} minute{'s' if minutes > 1 else ''}"
        else:
            return "À l'instant"


