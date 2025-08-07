import apiClient from './api';

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
      const response = await apiClient.get(url);

      return {
        success: true,
        data: response.data,
      };
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
      const response = await apiClient.get('/notifications/unread-count/');
      return {
        success: true,
        data: response.data,
      };
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
      return {
        success: true,
        data: { message: 'Notification deleted successfully' },
      };
    } catch (error) {
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
