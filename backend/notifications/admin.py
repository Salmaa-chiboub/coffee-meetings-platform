from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Admin interface for Notification model
    """
    list_display = [
        'title', 'recipient_email', 'type', 'priority', 
        'is_read', 'created_at', 'read_status'
    ]
    list_filter = [
        'type', 'priority', 'is_read', 'created_at',
        ('created_at', admin.DateFieldListFilter),
    ]
    search_fields = ['title', 'message', 'recipient__email', 'recipient__name']
    readonly_fields = ['id', 'created_at', 'read_at', 'time_since_created']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'recipient', 'title', 'message')
        }),
        ('Classification', {
            'fields': ('type', 'priority')
        }),
        ('Status', {
            'fields': ('is_read', 'created_at', 'read_at', 'time_since_created')
        }),
        ('Related Object', {
            'fields': ('related_object_type', 'related_object_id'),
            'classes': ('collapse',)
        }),
        ('Extra Data', {
            'fields': ('extra_data',),
            'classes': ('collapse',)
        }),
    )
    
    def recipient_email(self, obj):
        """Display recipient email"""
        return obj.recipient.email
    recipient_email.short_description = 'Recipient'
    recipient_email.admin_order_field = 'recipient__email'
    
    def read_status(self, obj):
        """Display read status with color coding"""
        if obj.is_read:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Read</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Unread</span>'
            )
    read_status.short_description = 'Status'
    
    actions = ['mark_as_read', 'mark_as_unread', 'delete_selected']
    
    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read"""
        updated = queryset.filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = 'Mark selected notifications as read'
    
    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread"""
        updated = queryset.filter(is_read=True).update(
            is_read=False,
            read_at=None
        )
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = 'Mark selected notifications as unread'



