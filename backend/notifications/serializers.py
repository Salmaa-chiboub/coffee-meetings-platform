from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model
    """
    time_since_created = serializers.ReadOnlyField()
    
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
