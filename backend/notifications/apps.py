from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Notifications'
    
    def ready(self):
        """
        Import signal handlers when the app is ready
        """
        import notifications.signals
        print("[Notifications] signals module loaded in apps.py ready()")
