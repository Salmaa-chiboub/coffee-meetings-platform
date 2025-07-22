from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    HRManagerLoginSerializer,
    HRManagerRegisterSerializer,
    HRManagerProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import RetrieveUpdateAPIView
from .authentication import CustomJWTAuthentication
from .models import HRManager, PasswordResetToken
class HRManagerLoginView(APIView):
    permission_classes = [AllowAny]  # Pas d'authentification requise pour login

    def post(self, request):
        serializer = HRManagerLoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HRManagerRegisterView(APIView):
    permission_classes = [AllowAny]  # Pas d'authentification requise pour register

    def post(self, request):
        serializer = HRManagerRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class HRManagerProfileView(RetrieveUpdateAPIView):
    serializer_class = HRManagerProfileSerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Return the authenticated HRManager instance
        return self.request.user


class PasswordResetRequestView(APIView):
    """
    View to handle password reset requests
    """
    permission_classes = [AllowAny]  # No authentication required

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                reset_token = serializer.save()
                return Response({
                    'message': 'Un email de réinitialisation a été envoyé à votre adresse email.',
                    'success': True
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'message': 'Une erreur est survenue lors de l\'envoi de l\'email.',
                    'error': str(e),
                    'success': False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            'message': 'Données invalides.',
            'errors': serializer.errors,
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    View to handle password reset confirmation
    """
    permission_classes = [AllowAny]  # No authentication required

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                return Response({
                    'message': 'Votre mot de passe a été réinitialisé avec succès.',
                    'success': True
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'message': 'Une erreur est survenue lors de la réinitialisation.',
                    'error': str(e),
                    'success': False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            'message': 'Données invalides.',
            'errors': serializer.errors,
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    View to handle password change for authenticated users
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, user=request.user)
        if serializer.is_valid():
            try:
                user = serializer.save()
                return Response({
                    'message': 'Votre mot de passe a été modifié avec succès.',
                    'success': True
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'message': 'Une erreur est survenue lors de la modification du mot de passe.',
                    'error': str(e),
                    'success': False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            'message': 'Données invalides.',
            'errors': serializer.errors,
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)