from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import HRManager
from notifications.services import NotificationService

@receiver(post_save, sender=HRManager)
def hr_manager_profile_updated(sender, instance, created, **kwargs):
    """Create notification when HR manager profile is updated"""
    if created:
        return  # Don't create notification for new users

    # Simple notification for any profile update
    try:
        notification = NotificationService.create_notification(
            recipient=instance,
            title="Profil Mis à Jour",
            message="Votre profil a été mis à jour avec succès.",
            notification_type='system',
            priority='low',
            related_object_type='hrmanager',
            related_object_id=instance.id
        )
    except Exception as e:
        print(f"[ERROR] Failed to create profile update notification: {str(e)}")
