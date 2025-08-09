from rest_framework import serializers
from django.utils import timezone
from .models import Notification


class LocalizedDateTimeField(serializers.DateTimeField):
    """
    Custom datetime field that always returns datetime in local timezone
    """
    def to_representation(self, value):
        if value is None:
            return None

        # Convert to local timezone
        local_value = timezone.localtime(value)
        return super().to_representation(local_value)


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model
    """
    time_since_created = serializers.ReadOnlyField()
    created_at = LocalizedDateTimeField(read_only=True)
    read_at = LocalizedDateTimeField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'priority',
            'is_read', 'created_at', 'read_at', 'time_since_created',
            'related_object_type', 'related_object_id', 'extra_data'
        ]
        read_only_fields = ['id', 'created_at', 'read_at', 'time_since_created']


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for notification lists
    """
    time_since_created = serializers.ReadOnlyField()
    created_at = LocalizedDateTimeField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'priority',
            'is_read', 'created_at', 'time_since_created'
        ]
        read_only_fields = ['id', 'created_at', 'time_since_created']


class NotificationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating notification status
    """
    class Meta:
        model = Notification
        fields = ['is_read']




class BulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk actions on notifications
    """
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of notification IDs to perform action on"
    )


class NotificationStatsSerializer(serializers.Serializer):
    """
    Serializer for notification statistics
    """
    total_count = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    read_count = serializers.IntegerField()
    type_breakdown = serializers.DictField()
    priority_breakdown = serializers.DictField()


class CreateNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for creating notifications
    """
    class Meta:
        model = Notification
        fields = [
            'recipient', 'title', 'message', 'type', 'priority',
            'related_object_type', 'related_object_id', 'extra_data'
        ]
    
    def validate(self, data):
        """
        Validate notification data
        """
        # Ensure related object fields are both provided or both empty
        related_type = data.get('related_object_type')
        related_id = data.get('related_object_id')
        
        if bool(related_type) != bool(related_id):
            raise serializers.ValidationError(
                "Both related_object_type and related_object_id must be provided together or both omitted"
            )
        
        return data
