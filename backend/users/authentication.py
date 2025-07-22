import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import HRManager


class CustomJWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication for HRManager model
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')

        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            raise AuthenticationFailed('Invalid authorization header format')

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = payload.get('user_id')

            if not user_id:
                raise AuthenticationFailed('Invalid token payload')

            try:
                user = HRManager.objects.get(id=user_id)
                # Vérifier que l'utilisateur est actif
                if not user.is_active:
                    raise AuthenticationFailed('User account is disabled')
                return (user, token)
            except HRManager.DoesNotExist:
                raise AuthenticationFailed('User not found')

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
        except Exception as e:
            raise AuthenticationFailed(f'Authentication error: {str(e)}')

        return None
