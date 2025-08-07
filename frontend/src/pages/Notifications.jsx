import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';

const Notifications = () => {
  // Use notification context
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  // Get notification type color
  const getTypeColor = (type) => {
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
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;

    return notificationTime.toLocaleDateString('fr-FR');
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
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

  // No filtering, just show all notifications
  const filteredNotifications = notifications;

  // Handle mark as read
  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };

  // Handle mark as unread
  const handleMarkAsUnread = async (id) => {
    await markAsUnread(id);
  };

  // Handle delete
  const handleDelete = async (id) => {
    await deleteNotification(id);
    setSelectedNotifications(prev => prev.filter(nId => nId !== id));
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    // TODO: Implement bulk mark as read API call
    for (const id of selectedNotifications) {
      await markAsRead(id);
    }
    setSelectedNotifications([]);
  };

  const handleBulkDelete = async () => {
    // TODO: Implement bulk delete API call
    for (const id of selectedNotifications) {
      await deleteNotification(id);
    }
    setSelectedNotifications([]);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-[#E8C4A0]/20 to-cream/30 rounded-xl">
                <BellIcon className="w-6 h-6 text-[#8B6F47]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#8B6F47]">Notifications</h1>
                <p className="text-sm text-warmGray-600">
                  {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour !'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              <button
                onClick={() => fetchNotifications()}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cream to-[#E8C4A0]/30 text-[#8B6F47] rounded-lg hover:from-cream/80 hover:to-[#E8C4A0]/40 transition-all duration-200 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualiser</span>
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#E8C4A0] to-peach-200 text-[#8B6F47] rounded-lg hover:from-[#E8C4A0]/80 hover:to-peach-200/80 transition-all duration-200 font-medium"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Tout marquer comme lu</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* No search or filter UI */}

        {/* Select All Checkbox */}
        {filteredNotifications.length > 0 && (
          <div className="mb-4 flex items-center space-x-3 px-4 py-2 bg-white/50 backdrop-blur-sm border border-[#E8C4A0]/20 rounded-lg">
            <button
              onClick={handleSelectAll}
              className="flex items-center justify-center w-5 h-5 border-2 border-[#E8C4A0] rounded transition-all duration-200 hover:bg-[#E8C4A0]/10"
            >
              {selectedNotifications.length === filteredNotifications.length && (
                <CheckIconSolid className="w-3 h-3 text-[#8B6F47]" />
              )}
            </button>
            <span className="text-sm text-[#8B6F47] font-medium">
              Sélectionner toutes les notifications
            </span>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const typeColors = getTypeColor(notification.type);
              const isSelected = selectedNotifications.includes(notification.id);

              return (
                <div
                  key={notification.id}
                  className={`group relative bg-white/70 backdrop-blur-sm border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:bg-white/80 ${
                    !notification.is_read
                      ? 'border-[#E8C4A0]/40 bg-gradient-to-r from-peach-50/30 to-cream/20'
                      : 'border-[#E8C4A0]/20'
                  } ${isSelected ? 'ring-2 ring-[#E8C4A0] border-[#E8C4A0]' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => handleSelectNotification(notification.id)}
                      className="flex items-center justify-center w-5 h-5 border-2 border-[#E8C4A0] rounded transition-all duration-200 hover:bg-[#E8C4A0]/10 mt-1"
                    >
                      {isSelected && (
                        <CheckIconSolid className="w-3 h-3 text-[#8B6F47]" />
                      )}
                    </button>

                    {/* Notification Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColors.bg} ${typeColors.border} border transition-all duration-200 group-hover:scale-110`}>
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

                        {/* Action Menu */}
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!notification.is_read ? (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsUnread(notification.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Mark as unread"
                            >
                              <BellIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete notification"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
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
              <h3 className="text-lg font-medium text-[#8B6F47] mb-2">Aucune notification trouvée</h3>
              <p className="text-warmGray-500">
                Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
              </p>
            </div>
          )}
        </div>

        {/* Load More Button - TODO: Implement pagination */}
        {filteredNotifications.length > 10 && (
          <div className="mt-8 text-center">
            <button
              className="px-6 py-3 bg-gradient-to-r from-[#E8C4A0] to-peach-200 text-[#8B6F47] rounded-lg hover:from-[#E8C4A0]/80 hover:to-peach-200/80 transition-all duration-200 font-medium"
            >
              Charger Plus de Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
