from django.contrib import admin
from .models import CampaignMatchingCriteria, EmployeePair


@admin.register(CampaignMatchingCriteria)
class CampaignMatchingCriteriaAdmin(admin.ModelAdmin):
    list_display = ['campaign', 'attribute_key', 'rule', 'created_at', 'created_by', 'is_locked']
    list_filter = ['rule', 'is_locked', 'created_at', 'campaign']
    search_fields = ['campaign__title', 'attribute_key', 'created_by']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('campaign', 'attribute_key', 'rule')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'created_by', 'is_locked'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmployeePair)
class EmployeePairAdmin(admin.ModelAdmin):
    list_display = [
        'campaign', 'employee1', 'employee2', 'email_status',
        'created_at', 'created_by', 'email_sent_at'
    ]
    list_filter = ['email_status', 'created_at', 'campaign']
    search_fields = [
        'campaign__title', 'employee1__name', 'employee1__email',
        'employee2__name', 'employee2__email', 'created_by'
    ]
    readonly_fields = ['created_at', 'email_sent_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Pair Information', {
            'fields': ('campaign', 'employee1', 'employee2')
        }),
        ('Email Status', {
            'fields': ('email_status', 'email_sent_at', 'email_error_message', 'email_sent')
        }),
        ('Audit Trail', {
            'fields': ('created_at', 'created_by', 'matching_criteria_snapshot'),
            'classes': ('collapse',)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly after creation"""
        readonly = list(self.readonly_fields)
        if obj:  # Editing existing object
            readonly.extend(['campaign', 'employee1', 'employee2'])
        return readonly
