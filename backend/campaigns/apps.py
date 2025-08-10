from django.apps import AppConfig


class CampaignsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'campaigns'

    def ready(self):
        # Register signals
        try:
            from . import signals  # noqa: F401
        except Exception:
            # Avoid hard crash on migration time
            pass
