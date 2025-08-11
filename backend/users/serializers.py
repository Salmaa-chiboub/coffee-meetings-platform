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

        # Get profile picture URL if it exists
        profile_picture_url = None
        if user.profile_picture:
            request = self.context.get('request')
            if request:
                profile_picture_url = request.build_absolute_uri(user.profile_picture.url)
            else:
                # Fallback if no request context (settings is already imported at top)
                profile_picture_url = f"{settings.MEDIA_URL}{user.profile_picture}"

        return {
            'user_id': user.id,
            'name': user.name,
            'email': user.email,
            'company_name': user.company_name,
            'profile_picture_url': profile_picture_url,
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
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = HRManager
        fields = ['id', 'name', 'email', 'company_name', 'profile_picture', 'profile_picture_url']
        read_only_fields = ['id', 'email', 'profile_picture_url']  # Email non modifiable

    def get_profile_picture_url(self, obj):
        """Get the full URL for the profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class ProfilePictureUploadSerializer(serializers.ModelSerializer):
    """Serializer for profile picture upload"""

    class Meta:
        model = HRManager
        fields = ['profile_picture']

    def validate_profile_picture(self, value):
        """Validate uploaded profile picture"""
        if not value:
            raise serializers.ValidationError("Profile picture is required")

        # Check file size (5MB limit)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Profile picture must be less than 5MB")

        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Profile picture must be a JPG, PNG, or WebP image"
            )

        return value


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
            subject = "🔐 Password Reset - Coffee Meetings Platform"

            # HTML email content
            html_message = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #2d3748;
                        margin: 0;
                        padding: 0;
                        background-color: #f7fafc;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                        overflow: hidden;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 32px 24px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                        letter-spacing: -0.025em;
                    }}
                    .content {{
                        padding: 32px 24px;
                    }}
                    .greeting {{
                        font-size: 18px;
                        margin-bottom: 24px;
                        color: #1a202c;
                    }}
                    .reset-section {{
                        background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
                        border: 1px solid #9ae6b4;
                        border-radius: 12px;
                        padding: 24px;
                        margin: 24px 0;
                        text-align: center;
                    }}
                    .reset-button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                        color: white;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;
                        transition: all 0.2s ease;
                        box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
                    }}
                    .reset-button:hover {{
                        transform: translateY(-1px);
                        box-shadow: 0 4px 8px rgba(72, 187, 120, 0.3);
                    }}
                    .footer {{
                        background-color: #f7fafc;
                        padding: 24px;
                        text-align: center;
                        border-top: 1px solid #e2e8f0;
                    }}
                    .footer p {{
                        margin: 8px 0;
                        color: #718096;
                        font-size: 14px;
                    }}
                    .warning {{
                        background-color: #fff5f5;
                        border-left: 4px solid #f56565;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 16px 0;
                    }}
                    .warning p {{
                        margin: 8px 0;
                        color: #742a2a;
                        font-size: 14px;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>🔐 Password Reset</h1>
                    </div>
                    
                    <div class="content">
                        <p class="greeting">Hello <strong>{user.name}</strong>,</p>
                        
                        <p>You've requested a password reset for your Coffee Meetings Platform account.</p>
                        
                        <div class="reset-section">
                            <h3>Reset Your Password</h3>
                            <p>Click the button below to create a new password:</p>
                            <a href="{reset_url}" class="reset-button">Reset Password</a>
                            <p style="font-size: 12px; margin-top: 12px; color: #4a5568;">
                                This link will expire in 1 hour for security reasons.
                            </p>
                        </div>
                        
                        <div class="warning">
                            <p><strong>⚠️ Security Notice:</strong></p>
                            <p>If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Questions? Contact our support team</p>
                        <p><strong>Coffee Meetings Platform</strong></p>
                    </div>
                </div>
            </body>
            </html>
            """

            # Plain text version
            plain_message = f"""
🔐 Password Reset

Hello {user.name},

You've requested a password reset for your Coffee Meetings Platform account.

Click the link below to create a new password:
{reset_url}

This link will expire in 1 hour for security reasons.

⚠️ SECURITY NOTICE:
If you didn't request this password reset, please ignore this email. Your account remains secure.

Questions? Contact our support team.

Best regards,
Coffee Meetings Platform Team
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
