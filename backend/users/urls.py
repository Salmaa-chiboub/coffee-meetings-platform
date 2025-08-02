from django.urls import path
from .views import (
    HRManagerLoginView,
    HRManagerRegisterView,
    HRManagerProfileView,
    ProfilePictureUploadView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ChangePasswordView
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)


urlpatterns = [
    path('login/', HRManagerLoginView.as_view(), name='hr-login'),
    path('register/', HRManagerRegisterView.as_view(), name='hr-register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', HRManagerProfileView.as_view(), name='hr-profile'),
    path('profile/picture/', ProfilePictureUploadView.as_view(), name='profile-picture-upload'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
