from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .models import Notification
from .serializers import (
    NotificationSerializer, NotificationListSerializer, NotificationUpdateSerializer,
    BulkActionSerializer, NotificationStatsSerializer,
    CreateNotificationSerializer
)
from .permissions import IsNotificationOwner


class NotificationPagination(PageNumberPagination):
    """Custom pagination for notifications"""
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    """
    List notifications for the authenticated user with filtering and pagination
    """
    serializer_class = NotificationListSerializer
    pagination_class = NotificationPagination
    permission_classes = [permissions.IsAuthenticated, IsNotificationOwner]

    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(recipient=user)

        # Order by created_at descending (newest first)
        queryset = queryset.order_by('-created_at')

        return queryset.select_related('recipient')

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)

        # Add unread count to response
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()

        response.data['unread_count'] = unread_count
        response.data['has_more'] = response.data.get('next') is not None

        return response


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific notification
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsNotificationOwner]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count_view(request):
    """
    Get the count of unread notifications for the authenticated user
    """
    count = Notification.objects.filter(
        recipient=request.user, 
        is_read=False
    ).count()
    
    return Response({'count': count})


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark a specific notification as read
    """
    notification = get_object_or_404(
        Notification, 
        id=notification_id, 
        recipient=request.user
    )
    
    notification.mark_as_read()
    
    return Response({
        'message': 'Notification marked as read',
        'notification': NotificationSerializer(notification).data
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_unread(request, notification_id):
    """
    Mark a specific notification as unread
    """
    notification = get_object_or_404(
        Notification, 
        id=notification_id, 
        recipient=request.user
    )
    
    notification.mark_as_unread()
    
    return Response({
        'message': 'Notification marked as unread',
        'notification': NotificationSerializer(notification).data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_read(request):
    """
    Mark all notifications as read for the authenticated user
    """
    updated_count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).update(
        is_read=True,
        read_at=timezone.now()
    )

    return Response({
        'message': f'{updated_count} notifications marked as read',
        'updated_count': updated_count
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_mark_read(request):
    """
    Mark multiple notifications as read
    """
    serializer = BulkActionSerializer(data=request.data)
    if serializer.is_valid():
        notification_ids = serializer.validated_data['notification_ids']
        
        updated_count = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_delete(request):
    """
    Delete multiple notifications
    """
    serializer = BulkActionSerializer(data=request.data)
    if serializer.is_valid():
        notification_ids = serializer.validated_data['notification_ids']
        
        deleted_count, _ = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user
        ).delete()
        
        return Response({
            'message': f'{deleted_count} notifications deleted',
            'deleted_count': deleted_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_stats(request):
    """
    Get notification statistics for the authenticated user
    """
    user_notifications = Notification.objects.filter(recipient=request.user)
    
    total_count = user_notifications.count()
    unread_count = user_notifications.filter(is_read=False).count()
    read_count = total_count - unread_count
    
    # Type breakdown
    type_breakdown = dict(
        user_notifications.values('type').annotate(
            count=Count('type')
        ).values_list('type', 'count')
    )
    
    # Priority breakdown
    priority_breakdown = dict(
        user_notifications.values('priority').annotate(
            count=Count('priority')
        ).values_list('priority', 'count')
    )
    
    stats = {
        'total_count': total_count,
        'unread_count': unread_count,
        'read_count': read_count,
        'type_breakdown': type_breakdown,
        'priority_breakdown': priority_breakdown
    }
    
    serializer = NotificationStatsSerializer(stats)
    return Response(serializer.data)


