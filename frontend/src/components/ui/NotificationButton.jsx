import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const NotificationButton = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use notification context
  const {
    notifications = [],
    unreadCount = 0,
    loading = false,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    smartRefresh,
    startPolling,
    isPollingActive
  } = useNotifications();

  // Initialize notifications and start polling on component mount
  useEffect(() => {
    // Initial fetch of notifications and unread count
    if (fetchNotifications && fetchUnreadCount) {
      fetchNotifications({ limit: 5 }); // Only fetch first 5 for dropdown
      fetchUnreadCount();

      // Start polling for new notifications if not already active
      if (startPolling && !isPollingActive) {
        startPolling();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use only real notifications from the API
  const displayNotifications = notifications || [];
  const displayUnreadCount = unreadCount || 0;

  // Get notification type icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'campaign':
        return CalendarDaysIcon;
      case 'evaluation':
        return ChartBarIcon;
      case 'system':
        return ExclamationTriangleIcon;
      case 'user':
        return UserGroupIcon;
      default:
        return BellIcon;
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if it's unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    setIsOpen(false);

    // Navigate based on notification type
    switch (notification.type) {
      case 'campaign':
        navigate('/app/campaigns');
        break;
      case 'evaluation':
        navigate('/app/history/campaigns');
        break;
      default:
        navigate('/app/notifications');
    }
  };

  // Handle dropdown toggle with smart refresh
  const handleToggleDropdown = () => {
    if (!isOpen && smartRefresh) {
      // Use smart refresh to get latest notifications when opening dropdown
      smartRefresh();
    }
    setIsOpen(!isOpen);
  };

  // Handle view all notifications
  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/app/notifications');
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      // Close dropdown immediately to show the updated state
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Notification Button */}
      <button
        onClick={handleToggleDropdown}
        className="group relative p-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#E8C4A0] focus:ring-offset-2 transform hover:scale-[1.05] active:scale-[0.95] bg-gradient-to-r from-[#E8C4A0]/10 to-cream/20 hover:from-[#E8C4A0]/20 hover:to-cream/30 border border-[#E8C4A0]/20 backdrop-blur-sm"
        title="Notifications"
      >
        <BellIcon className="w-5 h-5 text-[#8B6F47] group-hover:text-[#6B5537] transition-colors duration-200" />

        {/* Notification Badge */}
        {displayUnreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-peach-500 to-peach-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
            {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
          </div>
        )}

        {/* Subtle glow effect when there are notifications */}
        {displayUnreadCount > 0 && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E8C4A0]/20 to-cream/20 animate-pulse"></div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-[#E8C4A0]/30 z-50 animate-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#E8C4A0]/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellIcon className="w-4 h-4 text-[#8B6F47]" />
              <h3 className="text-sm font-semibold text-[#8B6F47]">Notifications</h3>
              {displayUnreadCount > 0 && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-peach-100 to-peach-200 text-peach-800 text-xs font-medium rounded-full">
                  {displayUnreadCount} nouveau{displayUnreadCount > 1 ? 'x' : ''}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#E8C4A0]/10 rounded-lg transition-colors duration-200"
            >
              <XMarkIcon className="w-4 h-4 text-[#8B6F47]/60 hover:text-[#8B6F47]" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {displayNotifications.length > 0 ? (
              displayNotifications.slice(0, 5).map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-[#E8C4A0]/10 hover:bg-gradient-to-r hover:from-[#E8C4A0]/5 hover:to-cream/10 transition-all duration-200 cursor-pointer group ${
                      !notification.is_read ? 'bg-gradient-to-r from-peach-50/30 to-cream/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Notification Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 transition-all duration-200 group-hover:scale-110 ${
                        notification.type === 'campaign'
                          ? 'bg-[#E8C4A0]/20 text-[#8B6F47] border border-[#E8C4A0]/30'
                          : notification.type === 'evaluation'
                          ? 'bg-peach-100/20 text-peach-700 border border-peach-200/30'
                          : 'bg-warmGray-100/20 text-warmGray-700 border border-warmGray-200/30'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#8B6F47] truncate group-hover:text-[#6B5537] transition-colors">
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-gradient-to-r from-peach-500 to-peach-600 rounded-full ml-2 animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-xs text-warmGray-600 mt-1 line-clamp-2 group-hover:text-warmGray-700 transition-colors">
                          {notification.message}
                        </p>
                        <p className="text-xs text-warmGray-400 mt-1 group-hover:text-warmGray-500 transition-colors">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <BellIcon className="w-8 h-8 text-[#E8C4A0]/40 mx-auto mb-2" />
                <p className="text-sm text-warmGray-500">Aucune notification</p>
                <p className="text-xs text-warmGray-400 mt-1">Vous êtes à jour !</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {displayNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-[#E8C4A0]/20 bg-gradient-to-r from-cream/20 to-[#E8C4A0]/5">
              <div className="flex items-center justify-between space-x-2">
                {displayUnreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#8B6F47]/70 hover:text-[#8B6F47] font-medium transition-colors duration-200 flex items-center space-x-1"
                    disabled={loading}
                  >
                    <CheckIcon className="w-3 h-3" />
                    <span>Tout marquer comme lu</span>
                  </button>
                )}
                <button
                  onClick={handleViewAll}
                  className="flex-1 text-sm text-[#8B6F47] hover:text-[#6B5537] font-medium transition-colors duration-200 text-center py-1 px-3 rounded-lg hover:bg-[#E8C4A0]/10"
                >
                  Voir toutes les notifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationButton;
