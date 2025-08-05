from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # Notification CRUD operations
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<uuid:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    
    # Notification status operations
    path('unread-count/', views.unread_count_view, name='unread-count'),
    path('<uuid:notification_id>/mark-read/', views.mark_notification_read, name='mark-read'),
    path('<uuid:notification_id>/mark-unread/', views.mark_notification_unread, name='mark-unread'),
    path('mark-all-read/', views.mark_all_read, name='mark-all-read'),
    
    # Bulk operations
    path('bulk-mark-read/', views.bulk_mark_read, name='bulk-mark-read'),
    path('bulk-delete/', views.bulk_delete, name='bulk-delete'),
    
    # Statistics and preferences
    path('stats/', views.notification_stats, name='notification-stats'),
]
