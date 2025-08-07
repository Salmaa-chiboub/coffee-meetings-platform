"""
Signal handlers for automatic notification creation
print("[DEBUG] notifications.signals module loaded")
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .services import NotificationService

User = get_user_model()
logger = logging.getLogger(__name__)


# Import models directly since they should be available
try:
    from campaigns.models import Campaign
    CAMPAIGN_MODEL_AVAILABLE = True
    print("[DEBUG] Campaign model import successful, signals will be registered.")
except ImportError:
    CAMPAIGN_MODEL_AVAILABLE = False
    print("[DEBUG] Campaign model import failed, signals will NOT be registered.")
    logger.warning("Campaign model not available for notifications")

try:
    from evaluations.models import Evaluation
    EVALUATION_MODEL_AVAILABLE = True
except ImportError:
    EVALUATION_MODEL_AVAILABLE = False
    logger.warning("Evaluation model not available for notifications")


if CAMPAIGN_MODEL_AVAILABLE:
    @receiver(post_save, sender=Campaign)
    def campaign_created_notification(sender, instance, created, **kwargs):
        print(f"[DEBUG] campaign_created_notification signal called. created={created}, instance={instance}")
        """
        Create notification when a campaign is created
        """
        if created:
            print("[DEBUG] campaign_created_notification: campaign was created.")
            try:
                # Notify the HR manager assigned to the campaign
                hr_manager = instance.hr_manager
                print(f"[DEBUG] hr_manager={hr_manager}")
                if hr_manager:
                    NotificationService.create_notification(
                        recipient=hr_manager,
                        title="Nouvelle Campagne Créée",
                        message=f'La campagne "{instance.title}" a été créée par {hr_manager.name}.',
                        notification_type='campaign',
                        priority='medium',
                        related_object_type='campaign',
                        related_object_id=instance.id,
                        extra_data={
                            'campaign_title': instance.title,
                            'campaign_id': instance.id,
                            'hr_manager_name': hr_manager.name,
                            'action': 'created'
                        }
                    )
                    print(f"[DEBUG] Notification created for campaign '{instance.title}' and HR manager '{hr_manager}'")
                    logger.info(f"Created notification for campaign creation: {instance.title}")
                else:
                    print("[DEBUG] No HR manager assigned to campaign; cannot send notification.")
                    logger.warning("No HR manager assigned to campaign; cannot send notification.")
            except Exception as e:
                print(f"[DEBUG] Exception occurred: {str(e)}")
                logger.error(f"Failed to create campaign creation notification: {str(e)}")


if EVALUATION_MODEL_AVAILABLE:
    from django.db.models.signals import pre_save

    @receiver(pre_save, sender=Evaluation)
    def evaluation_pre_save(sender, instance, **kwargs):
        """
        Store the previous value of 'used' before saving, for change detection in post_save.
        """
        if instance.pk:
            try:
                prev = Evaluation.objects.get(pk=instance.pk)
                instance._previous_used = prev.used
            except Evaluation.DoesNotExist:
                instance._previous_used = None
        else:
            instance._previous_used = None
    @receiver(post_save, sender=Evaluation)
    def evaluation_completed_notification(sender, instance, created, **kwargs):
        """
        Create notification when feedback is submitted (used changes to True)
        """
        try:
            prev_used = getattr(instance, '_previous_used', None)
            # Only notify when used changes from False to True
            if prev_used is not None and prev_used is False and instance.used is True:
                if instance.employee_pair and instance.employee_pair.campaign and instance.employee_pair.campaign.hr_manager:
                    NotificationService.notify_evaluation_completed(
                        evaluation=instance,
                        recipient=instance.employee_pair.campaign.hr_manager
                    )
                    logger.info(f"Created notification for evaluation completion")
                else:
                    logger.warning("Could not find HR manager for evaluation notification.")
        except Exception as e:
            logger.error(f"Failed to create evaluation completion notification: {str(e)}")


# You can add more signal handlers here for other events
# For example:
# - Employee added/removed
# - Campaign status changes
# - System maintenance notifications
# - etc.
