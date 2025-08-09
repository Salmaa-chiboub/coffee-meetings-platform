import apiClient from './api';

// Simple cache to prevent duplicate requests
const cache = {
  notifications: null,
  notificationsTimestamp: 0,
  unreadCount: null,
  unreadCountTimestamp: 0,
  pendingRequests: new Map()
};

// Cache duration (5 seconds)
const CACHE_DURATION = 5000;

// Notification API service
export const notificationAPI = {
  // Get notifications with filtering and pagination
  getNotifications: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination parameters
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);



      const url = `/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      // Fetch fresh data from database
      try {
        const response = await apiClient.get(url);
        const data = response.data;

        // Ensure consistent data structure
        const normalizedData = {
          results: data.results || [],
          count: data.count || 0,
          next: data.next || null,
          previous: data.previous || null,
          unread_count: data.unread_count || 0,
          has_more: data.has_more || false,
          page: data.page || 1
        };

        return {
          success: true,
          data: normalizedData,
        };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data || { message: 'Failed to fetch notifications' },
        };
      }
    } catch (error) {
      console.error('❌ Service Error:', error);
      return {
        success: false,
        error: { message: 'Failed to fetch notifications' },
      };
    }
  },

  // Get unread notification count
  getUnreadCount: async (forceRefresh = false) => {
    try {
      // Add cache buster for force refresh
      const queryParams = forceRefresh ? `?_t=${Date.now()}` : '';
      const url = `/notifications/unread-count/${queryParams}`;

      // Fetch fresh data from database
      try {
        const response = await apiClient.get(url);
        const data = response.data;

        // Ensure consistent data structure
        const normalizedData = {
          count: data.count || 0
        };

        return {
          success: true,
          data: normalizedData,
        };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data || { message: 'Failed to fetch unread count' },
        };
      }
    } catch (error) {
      console.error('❌ Unread count Service Error:', error);
      return {
        success: false,
        error: { message: 'Failed to fetch unread count' },
      };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/mark-read/`);
      // Clear all cache after successful update to ensure fresh data
      notificationAPI.clearCache();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to mark notification as read' },
      };
    }
  },

  // Mark notification as unread
  markAsUnread: async (notificationId) => {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/mark-unread/`);
      // Clear all cache after successful update to ensure fresh data
      notificationAPI.clearCache();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to mark notification as unread' },
      };
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await apiClient.post('/notifications/mark-all-read/');
      // Clear all cache after successful update to ensure fresh data
      notificationAPI.clearCache();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to mark all notifications as read' },
      };
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}/`);
      // Clear all cache after successful deletion
      notificationAPI.clearCache();
      return {
        success: true,
        data: { message: 'Notification deleted successfully' },
      };
    } catch (error) {
      console.error(`Failed to delete notification ${notificationId}:`, error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        // Still clear cache in case of 404 (might be deleted elsewhere)
        notificationAPI.clearCache();
        return {
          success: false,
          error: { message: 'Notification not found or already deleted' },
        };
      }

      return {
        success: false,
        error: error.response?.data || { message: 'Failed to delete notification' },
      };
    }
  },

  // Bulk delete notifications
  bulkDeleteNotifications: async (notificationIds) => {
    try {
      const response = await apiClient.post('/notifications/bulk-delete/', {
        notification_ids: notificationIds
      });
      // Clear all cache after successful bulk operation
      notificationAPI.clearCache();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to delete notifications' },
      };
    }
  },

  // Bulk mark notifications as read
  bulkMarkAsRead: async (notificationIds) => {
    try {
      const response = await apiClient.post('/notifications/bulk-mark-read/', {
        notification_ids: notificationIds
      });
      // Clear all cache after successful bulk operation
      notificationAPI.clearCache();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to mark notifications as read' },
      };
    }
  },

  // Get notification preferences
  getPreferences: async () => {
    try {
      const response = await apiClient.get('/notifications/preferences/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch notification preferences' },
      };
    }
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await apiClient.patch('/notifications/preferences/', preferences);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update notification preferences' },
      };
    }
  },

  // Force refresh notifications (bypasses cache)
  forceRefresh: async (params = {}) => {
    try {
      // Clear cache first to ensure fresh data
      notificationAPI.clearCache();

      // Force fresh request with cache-busting timestamp
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      queryParams.append('_t', Date.now().toString()); // Cache buster

      const url = `/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get(url);
      const data = response.data;

      // Ensure consistent data structure
      const normalizedData = {
        results: data.results || [],
        count: data.count || 0,
        next: data.next || null,
        previous: data.previous || null,
        unread_count: data.unread_count || 0,
        has_more: data.has_more || false,
        page: data.page || 1
      };

      return {
        success: true,
        data: normalizedData,
      };
    } catch (error) {
      console.error('❌ Force refresh error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to refresh notifications' },
      };
    }
  },

  // Cache management
  clearCache: () => {
    cache.notifications = null;
    cache.notificationsTimestamp = 0;
    cache.unreadCount = null;
    cache.unreadCountTimestamp = 0;
    cache.pendingRequests.clear();
  },

  invalidateNotificationsCache: () => {
    cache.notifications = null;
    cache.notificationsTimestamp = 0;
  },

  invalidateUnreadCountCache: () => {
    cache.unreadCount = null;
    cache.unreadCountTimestamp = 0;
  }
};

// Utility functions for notification handling
export const notificationUtils = {
  // Format notification time
  formatTime: (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;

    return notificationTime.toLocaleDateString('fr-FR');
  },

  // Get notification type icon
  getTypeIcon: (type) => {
    const iconMap = {
      campaign: 'CalendarDaysIcon',
      evaluation: 'ChartBarIcon',
      system: 'ExclamationTriangleIcon',
      user: 'UserGroupIcon',
      default: 'BellIcon'
    };
    return iconMap[type] || iconMap.default;
  },

  // Get notification type color
  getTypeColor: (type) => {
    const colorMap = {
      campaign: {
        bg: 'bg-[#E8C4A0]/20',
        text: 'text-[#8B6F47]',
        border: 'border-[#E8C4A0]/30'
      },
      evaluation: {
        bg: 'bg-peach-100/20',
        text: 'text-peach-700',
        border: 'border-peach-200/30'
      },
      system: {
        bg: 'bg-warmGray-100/20',
        text: 'text-warmGray-700',
        border: 'border-warmGray-200/30'
      },
      user: {
        bg: 'bg-cream/40',
        text: 'text-warmGray-800',
        border: 'border-warmGray-200/30'
      }
    };
    return colorMap[type] || colorMap.system;
  },

  // Get notification priority styling
  getPriorityStyle: (priority) => {
    const priorityMap = {
      high: {
        badge: 'bg-red-100 text-red-800 border-red-200',
        indicator: 'bg-red-500'
      },
      medium: {
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        indicator: 'bg-yellow-500'
      },
      low: {
        badge: 'bg-green-100 text-green-800 border-green-200',
        indicator: 'bg-green-500'
      }
    };
    return priorityMap[priority] || priorityMap.low;
  },

  // Truncate notification message
  truncateMessage: (message, maxLength = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  },

  // Group notifications by date
  groupByDate: (notifications) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      let groupKey;

      if (notificationDate.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = notificationDate.toLocaleDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }
};

export default notificationAPI;
