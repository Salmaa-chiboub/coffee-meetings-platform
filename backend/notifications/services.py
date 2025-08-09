"""
Notification service for creating and managing notifications
"""
import logging
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.utils import timezone
from users.models import HRManager

from .models import Notification
logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service class for creating and managing notifications
    """
    
    @staticmethod
    def create_notification(
        recipient: HRManager,
        title: str,
        message: str,
        notification_type: str = 'system',
        priority: str = 'low',
        related_object_type: Optional[str] = None,
        related_object_id: Optional[int] = None,
        extra_data: Optional[Dict] = None
    ) -> Notification:
        """
        Create a new notification

        Args:
            recipient: HRManager who will receive the notification
            title: Notification title
            message: Notification message
            notification_type: Type of notification (campaign, evaluation, system, user)
            priority: Priority level (low, medium, high)
            related_object_type: Type of related object
            related_object_id: ID of related object
            extra_data: Additional data for the notification

        Returns:
            Created Notification instance
        """
        try:
            notification = Notification.objects.create(
                recipient=recipient,
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                related_object_type=related_object_type,
                related_object_id=related_object_id,
                extra_data=extra_data or {}
            )

            logger.info(f"Created notification {notification.id} for user {recipient.email}")
            return notification

        except Exception as e:
            logger.error(f"Failed to create notification for user {recipient.email}: {str(e)}")
            raise
    
    @staticmethod
    def create_notification_from_template(
        recipient: HRManager,
        template_name: str,
        context: Optional[Dict] = None,
        related_object_type: Optional[str] = None,
        related_object_id: Optional[int] = None,
        extra_data: Optional[Dict] = None
    ) -> Optional[Notification]:
        """
        Create a notification using a template
        
        Args:
            recipient: HRManager who will receive the notification
            template_name: Name of the notification template
            context: Context data for template rendering
            related_object_type: Type of related object
            related_object_id: ID of related object
            extra_data: Additional data for the notification
            
        Returns:
            Created Notification instance or None if template not found
        """
        return None  # Placeholder since NotificationTemplate logic is removed
    
    @staticmethod
    def create_bulk_notifications(
        recipients: List[HRManager],
        title: str,
        message: str,
        notification_type: str = 'system',
        priority: str = 'low',
        related_object_type: Optional[str] = None,
        related_object_id: Optional[int] = None,
        extra_data: Optional[Dict] = None
    ) -> List[Notification]:
        """
        Create notifications for multiple recipients
        
        Args:
            recipients: List of HR managers who will receive the notification
            title: Notification title
            message: Notification message
            notification_type: Type of notification
            priority: Priority level
            related_object_type: Type of related object
            related_object_id: ID of related object
            extra_data: Additional data for the notification
            
        Returns:
            List of created Notification instances
        """
        notifications = []
        
        try:
            with transaction.atomic():
                for recipient in recipients:
                    notification = Notification.objects.create(
                        recipient=recipient,
                        title=title,
                        message=message,
                        type=notification_type,
                        priority=priority,
                        related_object_type=related_object_type,
                        related_object_id=related_object_id,
                        extra_data=extra_data or {}
                    )
                    notifications.append(notification)
                
                logger.info(f"Created {len(notifications)} bulk notifications")
                return notifications
                
        except Exception as e:
            logger.error(f"Failed to create bulk notifications: {str(e)}")
            raise
    
    @staticmethod
    def notify_campaign_created(campaign, creator: HRManager):
        """
        Create notification when a campaign is created
        """
        return NotificationService.create_notification(
            recipient=creator,
            title="Campagne Créée avec Succès",
            message=f'Votre campagne "{campaign.title}" a été créée et est prête à être lancée.',
            notification_type='campaign',
            priority='medium',
            related_object_type='campaign',
            related_object_id=campaign.id,
            extra_data={
                'campaign_title': campaign.title,
                'campaign_id': campaign.id,
                'action': 'created'
            }
        )
    
    @staticmethod
    def notify_campaign_ended(campaign, recipient: HRManager):
        """
        Create notification when a campaign ends
        """
        return NotificationService.create_notification(
            recipient=recipient,
            title="Campagne Terminée",
            message=f'La campagne "{campaign.title}" s\'est terminée avec succès.',
            notification_type='campaign',
            priority='low',
            related_object_type='campaign',
            related_object_id=campaign.id,
            extra_data={
                'campaign_title': campaign.title,
                'campaign_id': campaign.id,
                'action': 'ended'
            }
        )
    
    @staticmethod
    def notify_evaluation_completed(evaluation, recipient: HRManager):
        """
        Create notification when an evaluation is completed
        """
        employee_name = evaluation.employee.name if hasattr(evaluation, 'employee') else 'Un employé'

        return NotificationService.create_notification(
            recipient=recipient,
            title="Nouvelle Évaluation Terminée",
            message=f'{employee_name} a terminé son évaluation de rencontre café.',
            notification_type='evaluation',
            priority='low',
            related_object_type='evaluation',
            related_object_id=evaluation.id,
            extra_data={
                'employee_name': employee_name,
                'evaluation_id': evaluation.id,
                'action': 'completed'
            }
        )
    
    @staticmethod
    def notify_system_update(recipients: List[HRManager], update_message: str):
        """
        Create system update notifications for multiple users
        """
        return NotificationService.create_bulk_notifications(
            recipients=recipients,
            title="Mise à Jour Système",
            message=update_message,
            notification_type='system',
            priority='medium',
            extra_data={
                'action': 'system_update',
                'timestamp': timezone.now().isoformat()
            }
        )
    
    @staticmethod
    def get_user_notification_preferences(hr_manager: HRManager):
        """
        Placeholder: NotificationPreference model has been removed.
        """
        return None
    
    @staticmethod
    def should_send_notification(hr_manager: HRManager, notification_type: str) -> bool:
        """
        Check if a notification should be sent based on HR manager preferences
        """
        try:
            preferences = NotificationService.get_user_notification_preferences(hr_manager)
            
            # Map notification types to preference fields
            type_mapping = {
                'campaign': preferences.app_campaign_notifications,
                'evaluation': preferences.app_evaluation_notifications,
                'system': preferences.app_system_notifications,
                'user': True  # User notifications are always sent
            }
            
            return type_mapping.get(notification_type, True)
            
        except Exception as e:
            logger.error(f"Error checking notification preferences for HR manager {hr_manager.email}: {str(e)}")
            return True  # Default to sending notifications if there's an error
