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

      // Add filter parameters
      if (params.type && params.type !== 'all') queryParams.append('type', params.type);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.dateRange && params.dateRange !== 'all') queryParams.append('date_range', params.dateRange);
      if (params.is_read !== undefined) queryParams.append('is_read', params.is_read);

      const url = `/notifications/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      // Check cache for simple requests (no complex filters)
      const isSimpleRequest = !params.page && !params.type && !params.status && !params.dateRange && params.is_read === undefined;
      const now = Date.now();

      if (isSimpleRequest && cache.notifications && (now - cache.notificationsTimestamp) < CACHE_DURATION) {
        console.log('📋 Using cached notifications');
        return {
          success: true,
          data: cache.notifications,
        };
      }

      // Check for pending request to avoid duplicates
      if (cache.pendingRequests.has(url)) {
        console.log('⏳ Waiting for pending notification request');
        return cache.pendingRequests.get(url);
      }

      // Create promise for this request
      const requestPromise = (async () => {
        try {
          const response = await apiClient.get(url);
          const data = response.data;

          // Cache simple requests
          if (isSimpleRequest) {
            cache.notifications = data;
            cache.notificationsTimestamp = now;
          }

          return {
            success: true,
            data: data,
          };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data || { message: 'Failed to fetch notifications' },
          };
        } finally {
          // Remove from pending requests
          cache.pendingRequests.delete(url);
        }
      })();

      // Store pending request
      cache.pendingRequests.set(url, requestPromise);

      return requestPromise;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch notifications' },
      };
    }
  },

  // Get unread notification count
  getUnreadCount: async () => {
    try {
      const now = Date.now();
      const url = '/notifications/unread-count/';

      // Check cache
      if (cache.unreadCount && (now - cache.unreadCountTimestamp) < CACHE_DURATION) {
        console.log('🔔 Using cached unread count');
        return {
          success: true,
          data: cache.unreadCount,
        };
      }

      // Check for pending request
      if (cache.pendingRequests.has(url)) {
        console.log('⏳ Waiting for pending unread count request');
        return cache.pendingRequests.get(url);
      }

      // Create promise for this request
      const requestPromise = (async () => {
        try {
          const response = await apiClient.get(url);
          const data = response.data;

          // Cache the result
          cache.unreadCount = data;
          cache.unreadCountTimestamp = now;

          return {
            success: true,
            data: data,
          };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data || { message: 'Failed to fetch unread count' },
          };
        } finally {
          // Remove from pending requests
          cache.pendingRequests.delete(url);
        }
      })();

      // Store pending request
      cache.pendingRequests.set(url, requestPromise);

      return requestPromise;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch unread count' },
      };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/mark-read/`);
      // Invalidate cache after successful update
      notificationAPI.invalidateNotificationsCache();
      notificationAPI.invalidateUnreadCountCache();
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
      // Invalidate cache after successful update
      notificationAPI.invalidateNotificationsCache();
      notificationAPI.invalidateUnreadCountCache();
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
      // Invalidate cache after successful update
      notificationAPI.invalidateNotificationsCache();
      notificationAPI.invalidateUnreadCountCache();
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
      // Invalidate cache after successful deletion
      notificationAPI.invalidateNotificationsCache();
      notificationAPI.invalidateUnreadCountCache();
      return {
        success: true,
        data: { message: 'Notification deleted successfully' },
      };
    } catch (error) {
      console.error(`Failed to delete notification ${notificationId}:`, error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        // Still invalidate cache in case of 404 (might be deleted elsewhere)
        notificationAPI.invalidateNotificationsCache();
        notificationAPI.invalidateUnreadCountCache();
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

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    
    return notificationTime.toLocaleDateString();
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
