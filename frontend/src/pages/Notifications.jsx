import React, { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/notificationService';
import { useNotifications } from '../contexts/NotificationContext';
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
  // Use notification context for state management
  const {
    notifications,
    unreadCount,
    loading,
    pagination,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  // Local UI state
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);



  // Toast notification helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };



  // Force refresh function
  const handleForceRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Force refresh from database to get latest state
      await fetchNotifications({ forceRefresh: true });
      showToast('Notifications actualisées', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'actualisation', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch notifications on component mount only
  useEffect(() => {
    if (notifications.length === 0 && !loading) {
      fetchNotifications();
    }
  }, []); // Only run on mount

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

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;

    return notificationTime.toLocaleDateString('fr-FR');
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

  // Handle mark as read - use context method
  const handleMarkAsRead = async (id) => {
    try {
      const success = await markAsRead(id);
      if (success) {
        setSelectedNotifications(prev => prev.filter(nId => nId !== id));
      }
    } catch (error) {
      showToast('Erreur lors du marquage', 'error');
    }
  };

  // Handle mark as unread - use context method
  const handleMarkAsUnread = async (id) => {
    try {
      const success = await markAsUnread(id);
      if (success) {
        setSelectedNotifications(prev => prev.filter(nId => nId !== id));
      }
    } catch (error) {
      showToast('Erreur lors du marquage', 'error');
    }
  };

  // Handle delete - use context method
  const handleDelete = async (id) => {
    try {
      const success = await deleteNotification(id);
      if (success) {
        setSelectedNotifications(prev => prev.filter(nId => nId !== id));
      }
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    try {
      for (const id of selectedNotifications) {
        await markAsRead(id);
      }
      setSelectedNotifications([]);
      setShowCheckboxes(false);
      showToast('Notifications marquées comme lues', 'success');
    } catch (error) {
      showToast('Erreur lors du marquage', 'error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      setSelectedNotifications([]);
      setShowCheckboxes(false);
      showToast('Notifications supprimées', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // Handle mark all as read - use context method
  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (success) {
        showToast('Toutes les notifications marquées comme lues', 'success');
      } else {
        showToast('Erreur lors du marquage', 'error');
      }
    } catch (error) {
      showToast('Erreur lors du marquage', 'error');
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
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          toast.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' && <CheckIcon className="w-5 h-5" />}
            {toast.type === 'error' && <ExclamationCircleIcon className="w-5 h-5" />}
            {toast.type === 'info' && <BellIcon className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

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
                  {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour !'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              <button
                onClick={handleForceRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cream to-[#E8C4A0]/30 text-[#8B6F47] rounded-lg hover:from-cream/80 hover:to-[#E8C4A0]/40 transition-all duration-200 font-medium"
                disabled={loading || isRefreshing}
              >
                <svg className={`w-4 h-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{(loading || isRefreshing) ? 'Actualisation...' : 'Actualiser'}</span>
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
                    ? `${selectedNotifications.length} sélectionnée${selectedNotifications.length > 1 ? 's' : ''}`
                    : 'Sélectionner toutes les notifications'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedNotifications.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkMarkAsRead}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      disabled={loading}
                    >
                      Marquer comme lues
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      disabled={loading}
                    >
                      Supprimer
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseSelection}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Annuler
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
              <h3 className="text-lg font-medium text-[#8B6F47] mb-2">Aucune notification trouvée</h3>
              <p className="text-warmGray-500">
                Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
              </p>

            </div>
          )}
        </div>

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                console.log('📄 Loading more notifications...');
                loadMore();
              }}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#E8C4A0] to-peach-200 text-[#8B6F47] rounded-lg hover:from-[#E8C4A0]/80 hover:to-peach-200/80 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47]"></div>
                  <span>Chargement...</span>
                </div>
              ) : (
                'Charger Plus de Notifications'
              )}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {notifications.length > 0 && (
          <div className="mt-4 text-center text-sm text-warmGray-500">
            {notifications.length} notification{notifications.length > 1 ? 's' : ''} affichée{notifications.length > 1 ? 's' : ''}
            {pagination.total > notifications.length && (
              <span> sur {pagination.total} au total</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
