import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/notificationService';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';

const Notifications = () => {
  // Local state instead of context to avoid loops
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

  // Fetch notifications function
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationAPI.getNotifications();
      if (result.success) {
        const notifications = result.data.results || [];
        setNotifications(notifications);
        setUnreadCount(result.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on component mount only
  useEffect(() => {
    fetchNotifications();
  }, []); // No dependencies to prevent loops

  // Get notification type icon with improved mapping
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'campaign':
        return CalendarDaysIcon;
      case 'evaluation':
        return ChartBarIcon;
      case 'system':
        return CogIcon;
      case 'user':
      case 'profile':
        return UserIcon;
      case 'message':
      case 'chat':
        return ChatBubbleBottomCenterTextIcon;
      case 'alert':
      case 'warning':
        return ExclamationCircleIcon;
      case 'meeting':
        return UserGroupIcon;
      default:
        return BellIcon;
    }
  };

  // Get notification type color
  const getTypeColor = (type) => {
    const colorMap = {
      campaign: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      },
      evaluation: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200'
      },
      system: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200'
      },
      user: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200'
      },
      profile: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200'
      },
      message: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200'
      },
      chat: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200'
      },
      alert: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200'
      },
      warning: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200'
      },
      meeting: {
        bg: 'bg-[#E8C4A0]/20',
        text: 'text-[#8B6F47]',
        border: 'border-[#E8C4A0]/30'
      }
    };
    return colorMap[type] || colorMap.system;
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return notificationTime.toLocaleDateString();
  };

  // Handle long press for mobile
  const handleTouchStart = (notificationId) => {
    const timer = setTimeout(() => {
      setShowCheckboxes(true);
      setSelectedNotifications([notificationId]);
    }, 800); // 800ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle desktop click to show checkboxes
  const handleDesktopClick = (e, notificationId) => {
    if (e.detail === 1) { // Single click
      if (!showCheckboxes) {
        setShowCheckboxes(true);
        setSelectedNotifications([notificationId]);
      } else {
        handleSelectNotification(notificationId);
      }
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  // Handle individual selection
  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  // Close selection mode
  const handleCloseSelection = () => {
    setShowCheckboxes(false);
    setSelectedNotifications([]);
  };

  // Handle mark as read
  const handleMarkAsRead = async (id) => {
    try {
      const result = await notificationAPI.markAsRead(id);
      if (result.success) {
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Handle mark as unread
  const handleMarkAsUnread = async (id) => {
    try {
      const result = await notificationAPI.markAsUnread(id);
      if (result.success) {
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, is_read: false } : n
        ));
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const result = await notificationAPI.deleteNotification(id);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setSelectedNotifications(prev => prev.filter(nId => nId !== id));
        // Update unread count if notification was unread
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Handle deletion failure - remove from UI if it was a 404 (already deleted)
        if (result.error?.message?.includes('not found')) {
          console.warn('Notification was already deleted, removing from UI');
          setNotifications(prev => prev.filter(n => n.id !== id));
          setSelectedNotifications(prev => prev.filter(nId => nId !== id));
        } else {
          console.error('Failed to delete notification:', result.error);
          // Could show a toast notification here
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    for (const id of selectedNotifications) {
      await handleMarkAsRead(id);
    }
    setSelectedNotifications([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedNotifications) {
      await handleDelete(id);
    }
    setSelectedNotifications([]);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationAPI.markAllAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6F47]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Header with reduced margins */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-[#E8C4A0]/20 to-cream/30 rounded-xl">
                <BellIcon className="w-6 h-6 text-[#8B6F47]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#8B6F47]">Notifications</h1>
                <p className="text-sm text-warmGray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#E8C4A0] to-peach-200 text-[#8B6F47] rounded-lg hover:from-[#E8C4A0]/80 hover:to-peach-200/80 transition-all duration-200 font-medium"
              >
                <CheckIcon className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Bulk actions bar - only show when checkboxes are visible */}
        {showCheckboxes && (
          <div className="mb-4 p-3 bg-white/70 backdrop-blur-sm border border-[#E8C4A0]/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center w-5 h-5 border-2 border-[#E8C4A0] rounded transition-all duration-200 hover:bg-[#E8C4A0]/10"
                >
                  {selectedNotifications.length === notifications.length && (
                    <CheckIconSolid className="w-3 h-3 text-[#8B6F47]" />
                  )}
                </button>
                <span className="text-sm text-[#8B6F47] font-medium">
                  {selectedNotifications.length > 0 
                    ? `${selectedNotifications.length} selected`
                    : 'Select all notifications'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedNotifications.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkMarkAsRead}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      Mark as read
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseSelection}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List with reduced spacing */}
        <div className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const typeColors = getTypeColor(notification.type);
              const isSelected = selectedNotifications.includes(notification.id);

              return (
                <div
                  key={notification.id}
                  className={`group relative bg-white/70 backdrop-blur-sm border rounded-xl p-3 transition-all duration-200 hover:shadow-md hover:bg-white/80 ${
                    !notification.is_read
                      ? 'border-[#E8C4A0]/40 bg-gradient-to-r from-peach-50/30 to-cream/20'
                      : 'border-[#E8C4A0]/20'
                  } ${isSelected ? 'ring-2 ring-[#E8C4A0] border-[#E8C4A0]' : ''}`}
                  onTouchStart={() => handleTouchStart(notification.id)}
                  onTouchEnd={handleTouchEnd}
                  onClick={(e) => handleDesktopClick(e, notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Selection Checkbox - only show when in selection mode */}
                    {showCheckboxes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNotification(notification.id);
                        }}
                        className="flex items-center justify-center w-5 h-5 border-2 border-[#E8C4A0] rounded transition-all duration-200 hover:bg-[#E8C4A0]/10 mt-1"
                      >
                        {isSelected && (
                          <CheckIconSolid className="w-3 h-3 text-[#8B6F47]" />
                        )}
                      </button>
                    )}

                    {/* Notification Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColors.bg} ${typeColors.border} border transition-all duration-200 group-hover:scale-110 flex-shrink-0`}>
                      <IconComponent className={`w-5 h-5 ${typeColors.text}`} />
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-semibold text-[#8B6F47] group-hover:text-[#6B5537] transition-colors">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-gradient-to-r from-peach-500 to-peach-600 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-sm text-warmGray-600 group-hover:text-warmGray-700 transition-colors leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-warmGray-400 group-hover:text-warmGray-500 transition-colors">
                              {formatTime(notification.created_at)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text} border ${typeColors.border}`}>
                              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Action Menu - only show when not in selection mode */}
                        {!showCheckboxes && (
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {!notification.is_read ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsUnread(notification.id);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Mark as unread"
                              >
                                <BellIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete notification"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#E8C4A0]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellIcon className="w-8 h-8 text-[#E8C4A0]" />
              </div>
              <h3 className="text-lg font-medium text-[#8B6F47] mb-2">No notifications found</h3>
              <p className="text-warmGray-500">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Load More Button - TODO: Implement pagination */}
        {notifications.length > 10 && (
          <div className="mt-6 text-center">
            <button
              className="px-6 py-3 bg-gradient-to-r from-[#E8C4A0] to-peach-200 text-[#8B6F47] rounded-lg hover:from-[#E8C4A0]/80 hover:to-peach-200/80 transition-all duration-200 font-medium"
            >
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
