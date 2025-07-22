from django.db import models
from django.utils import timezone
import uuid

# Create your models here.


class HRManager(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.TextField()
    company_name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

    # Propriétés requises pour l'authentification Django REST Framework
    @property
    def is_authenticated(self):
        """Toujours True pour un utilisateur authentifié"""
        return True

    @property
    def is_anonymous(self):
        """Toujours False pour un utilisateur authentifié"""
        return False

    @property
    def is_active(self):
        """Toujours True - vous pouvez ajouter une logique plus complexe si nécessaire"""
        return True


class PasswordResetToken(models.Model):
    """
    Model to store password reset tokens for HRManager users
    """
    user = models.ForeignKey(HRManager, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Password reset token for {self.user.email}"

    def is_expired(self):
        """Check if the token has expired"""
        return timezone.now() > self.expires_at

    def is_valid(self):
        """Check if the token is valid (not used and not expired)"""
        return not self.is_used and not self.is_expired()

    def mark_as_used(self):
        """Mark the token as used"""
        self.is_used = True
        self.save()

    @classmethod
    def cleanup_expired_tokens(cls):
        """Remove expired tokens from the database"""
        from django.utils import timezone
        cls.objects.filter(expires_at__lt=timezone.now()).delete()
