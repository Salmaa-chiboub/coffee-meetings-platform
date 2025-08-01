import jwt
from django.conf import settings
from rest_framework import serializers
from .models import HRManager, PasswordResetToken
from django.contrib.auth.hashers import check_password, make_password
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import re
import uuid

class HRManagerLoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    access_token = serializers.CharField(read_only=True)
    refresh_token = serializers.CharField(read_only=True)

    class Meta:
        model = HRManager
        fields = ['email', 'password', 'access_token', 'refresh_token']

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = HRManager.objects.get(email=email)
        except HRManager.DoesNotExist:
            raise serializers.ValidationError("Email ou mot de passe incorrect.")

        if not check_password(password, user.password_hash):
            raise serializers.ValidationError("Email ou mot de passe incorrect.")

        # 🔐 Generate access token (expire in 7 days)
        access_payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow(),
        }
        access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        # 🔄 Generate refresh token (expire in 30 days)
        refresh_payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        return {
            'user_id': user.id,
            'name': user.name,
            'email': user.email,
            'access_token': access_token,
            'refresh_token': refresh_token
        }




class HRManagerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    token = serializers.CharField(read_only=True)
    refresh_token = serializers.CharField(read_only=True)

    class Meta:
        model = HRManager
        fields = ['id', 'name', 'email', 'password', 'company_name', 'token', 'refresh_token']

    def validate_email(self, value):
        if HRManager.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email déjà utilisé.")
        return value

    def validate_name(self, value):
        if not re.match(r'^[a-zA-Z\s]+$', value):
            raise serializers.ValidationError("Le nom ne doit contenir que des lettres et espaces.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins une lettre majuscule.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins un chiffre.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(password)
        user = HRManager.objects.create(**validated_data)

        # Création token d'accès (7 days)
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7),  # 7 days access token
            'iat': datetime.utcnow(),
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        # Création refresh token (30 days)
        refresh_payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=30),  # refresh token valide 30 jours
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

        # On ajoute les tokens à l'instance user (objet Python, pas en base)
        user.token = token
        user.refresh_token = refresh_token

        return user
    
class HRManagerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRManager
        fields = ['id', 'name', 'email', 'company_name']
        read_only_fields = ['id']  # Email non modifiable


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        """Validate that the email exists in the system"""
        try:
            user = HRManager.objects.get(email=value)
        except HRManager.DoesNotExist:
            raise serializers.ValidationError("Aucun compte n'est associé à cette adresse email.")
        return value

    def save(self):
        """Create password reset token and send email"""
        email = self.validated_data['email']
        user = HRManager.objects.get(email=email)

        # Invalidate any existing unused tokens for this user
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)

        # Create new reset token
        reset_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(hours=1)  # Token expires in 1 hour
        )

        # Send email with reset link
        self._send_reset_email(user, reset_token)

        return reset_token

    def _send_reset_email(self, user, reset_token):
        """Send password reset email to user"""
        try:
            # Create reset URL (you can customize this based on your frontend)
            reset_url = f"http://localhost:3000/reset-password?token={reset_token.token}"

            # Email subject and content
            subject = "Réinitialisation de votre mot de passe - Coffee Meetings Platform"

            # HTML email content
            html_message = f"""
            <html>
            <body>
                <h2>Réinitialisation de votre mot de passe</h2>
                <p>Bonjour {user.name},</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Coffee Meetings Platform.</p>
                <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
                <p><a href="{reset_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
                <p>Ce lien expirera dans 1 heure.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                <br>
                <p>Cordialement,<br>L'équipe Coffee Meetings Platform</p>
            </body>
            </html>
            """

            # Plain text version
            plain_message = f"""
            Réinitialisation de votre mot de passe

            Bonjour {user.name},

            Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Coffee Meetings Platform.

            Copiez et collez ce lien dans votre navigateur pour réinitialiser votre mot de passe :
            {reset_url}

            Ce lien expirera dans 1 heure.

            Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.

            Cordialement,
            L'équipe Coffee Meetings Platform
            """

            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

        except Exception as e:
            # Log the error in production
            print(f"Error sending password reset email: {str(e)}")
            # In development, we'll continue without failing
            pass


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation
    """
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_token(self, value):
        """Validate that the token exists and is valid"""
        try:
            reset_token = PasswordResetToken.objects.get(token=value)
            if not reset_token.is_valid():
                if reset_token.is_used:
                    raise serializers.ValidationError("Ce token a déjà été utilisé.")
                elif reset_token.is_expired():
                    raise serializers.ValidationError("Ce token a expiré.")
                else:
                    raise serializers.ValidationError("Token invalide.")
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Token invalide.")
        return value

    def validate_new_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins une lettre majuscule.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins un chiffre.")
        return value

    def validate(self, data):
        """Validate that passwords match"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def save(self):
        """Reset the user's password"""
        token = self.validated_data['token']
        new_password = self.validated_data['new_password']

        # Get the reset token and user
        reset_token = PasswordResetToken.objects.get(token=token)
        user = reset_token.user

        # Update user's password
        user.password_hash = make_password(new_password)
        user.save()

        # Mark token as used
        reset_token.mark_as_used()

        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password when user is authenticated
    """
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def validate_current_password(self, value):
        """Validate that the current password is correct"""
        if not self.user:
            raise serializers.ValidationError("Utilisateur non authentifié.")

        if not check_password(value, self.user.password_hash):
            raise serializers.ValidationError("Le mot de passe actuel est incorrect.")
        return value

    def validate_new_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins une lettre majuscule.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins un chiffre.")
        return value

    def validate(self, data):
        """Validate that passwords match and new password is different from current"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas.")

        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError("Le nouveau mot de passe doit être différent de l'ancien.")

        return data

    def save(self):
        """Update the user's password"""
        new_password = self.validated_data['new_password']

        # Update user's password
        self.user.password_hash = make_password(new_password)
        self.user.save()

        return self.user