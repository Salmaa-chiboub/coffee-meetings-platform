from django.apps import AppConfig


class UsersConfig(AppConfig):
    def ready(self):
        import users.signals
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
