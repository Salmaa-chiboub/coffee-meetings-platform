from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import HRManager
from notifications.services import NotificationService

@receiver(pre_save, sender=HRManager)
def hrmanager_profile_update_notification(sender, instance, **kwargs):
    if not instance.pk:
        # New HRManager, do not notify
        return
    try:
        prev = HRManager.objects.get(pk=instance.pk)
    except HRManager.DoesNotExist:
        return

    changed_fields = []
    if prev.name != instance.name:
        changed_fields.append('name')
    if prev.email != instance.email:
        changed_fields.append('email')
    if prev.password_hash != instance.password_hash:
        changed_fields.append('password')
    if prev.profile_picture != instance.profile_picture:
        changed_fields.append('profile')

    if changed_fields:
        NotificationService.create_notification(
            recipient=instance,
            title="Profile Updated",
            message=f"Your profile has been updated: {', '.join(changed_fields)}.",
            notification_type='system',
            priority='low',
            related_object_type='hrmanager',
            related_object_id=instance.id,
            extra_data={'changed_fields': changed_fields}
        )
