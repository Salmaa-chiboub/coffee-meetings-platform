import React, { createContext, useContext, useReducer, useCallback, useState, useRef, useEffect } from 'react';
import { notificationAPI } from '../services/notificationService';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  lastFetch: null,
  // No filters
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  }
};

// Action types
const NOTIFICATION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_AS_UNREAD: 'MARK_AS_UNREAD',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  RESET_NOTIFICATIONS: 'RESET_NOTIFICATIONS'
};

// Reducer function
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case NOTIFICATION_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount || 0,
        pagination: { ...state.pagination, ...action.payload.pagination },
        lastFetch: new Date().toISOString(),
        loading: false,
        error: null
      };

    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = action.payload;
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: newNotification.is_read ? state.unreadCount : state.unreadCount + 1
      };

    case NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        )
      };

    case NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION:
      const removedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: removedNotification && !removedNotification.is_read 
          ? state.unreadCount - 1 
          : state.unreadCount
      };

    case NOTIFICATION_ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, is_read: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case NOTIFICATION_ACTIONS.MARK_AS_UNREAD:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, is_read: false }
            : notification
        ),
        unreadCount: state.unreadCount + 1
      };

    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          is_read: true
        })),
        unreadCount: 0
      };



    case NOTIFICATION_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    case NOTIFICATION_ACTIONS.RESET_NOTIFICATIONS:
      return initialState;

    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Use ref to access current state without causing re-renders
  const stateRef = useRef(state);
  const [isPollingActive, setIsPollingActive] = useState(true);
  const pollingIntervalRef = useRef(null);
  const canUseNotifications = isAuthenticated && !authLoading;

  stateRef.current = state;

  // Fetch notifications
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!canUseNotifications) {
      return;
    }
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });

      const currentState = stateRef.current;
      const params = {
        page: options.page || currentState.pagination.page,
        limit: options.limit || currentState.pagination.limit
      };

      // If forceRefresh is requested, use forceRefresh API
      const result = options.forceRefresh
        ? await notificationAPI.forceRefresh(params)
        : await notificationAPI.getNotifications(params);

      if (result.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
          payload: {
            notifications: options.append ? [...currentState.notifications, ...result.data.results] : result.data.results,
            unreadCount: result.data.unread_count,
            pagination: {
              page: result.data.page || 1,
              total: result.data.count || 0,
              hasMore: result.data.has_more || false
            }
          }
        });
      } else {
        dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: result.error });
      }
    } catch (error) {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: false });
    }
  }, [canUseNotifications]); // Depends on auth

  // Fetch unread count
  const fetchUnreadCount = useCallback(async (forceRefresh = false) => {
    if (!canUseNotifications) {
      return;
    }
    try {
      const result = await notificationAPI.getUnreadCount(forceRefresh);
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: result.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [canUseNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!canUseNotifications) {
      return false;
    }
    try {
      const result = await notificationAPI.markAsRead(notificationId);
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_READ, payload: notificationId });
        // Force refresh unread count to ensure badge updates immediately
        await fetchUnreadCount(true);
      }
      return result.success;
    } catch (error) {
      return false;
    }
  }, [canUseNotifications, fetchUnreadCount]);

  // Mark notification as unread
  const markAsUnread = useCallback(async (notificationId) => {
    if (!canUseNotifications) {
      return false;
    }
    try {
      const result = await notificationAPI.markAsUnread(notificationId);
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_UNREAD, payload: notificationId });
        // Force refresh unread count to ensure badge updates immediately
        await fetchUnreadCount(true);
      }
      return result.success;
    } catch (error) {
      return false;
    }
  }, [canUseNotifications, fetchUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!canUseNotifications) {
      return false;
    }
    try {
      const result = await notificationAPI.markAllAsRead();
      if (result.success) {
        // Update local state immediately
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });

        // Force refresh from database to ensure consistency
        await fetchNotifications({ forceRefresh: true });
        await fetchUnreadCount(true);
      }
      return result.success;
    } catch (error) {
      return false;
    }
  }, [fetchNotifications, canUseNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!canUseNotifications) {
      return false;
    }
    try {
      const result = await notificationAPI.deleteNotification(notificationId);
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION, payload: notificationId });
        await fetchUnreadCount(true);
      }
      return result.success;
    } catch (error) {
      return false;
    }
  }, [canUseNotifications, fetchUnreadCount]);



  // Load more notifications (pagination)
  const loadMore = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.pagination.hasMore && !currentState.loading) {
      fetchNotifications({
        page: currentState.pagination.page + 1,
        append: true
      });
    }
  }, [fetchNotifications]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: notification });
  }, []);

  // Smart refresh - only refresh if data is stale
  const smartRefresh = useCallback(async () => {
    const currentState = stateRef.current;
    const now = Date.now();
    const lastFetchTime = currentState.lastFetch ? new Date(currentState.lastFetch).getTime() : 0;
    const timeSinceLastFetch = now - lastFetchTime;

    // Only refresh if data is older than 30 seconds
    if (timeSinceLastFetch > 30000) {
      await fetchNotifications({ forceRefresh: true });
      await fetchUnreadCount(true);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Automatic polling for new notifications
  const startPolling = useCallback(() => {
    if (!canUseNotifications) {
      return;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 15 seconds for new notifications (more responsive)
    pollingIntervalRef.current = setInterval(async () => {
      if (isPollingActive) {
        try {
          // Only check unread count to minimize server load
          const currentUnreadCount = stateRef.current.unreadCount;
          await fetchUnreadCount(true);

          // If unread count increased, also refresh notifications for dropdown
          const newUnreadCount = stateRef.current.unreadCount;
          if (newUnreadCount > currentUnreadCount) {
            // New notifications detected, refresh the first few for dropdown
            await fetchNotifications({ limit: 5, forceRefresh: true });
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 15000); // 15 seconds for more responsive updates
  }, [isPollingActive, fetchUnreadCount, fetchNotifications, canUseNotifications]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Trigger immediate check for new notifications (useful after user actions)
  const triggerImmediateCheck = useCallback(async () => {
    if (!canUseNotifications) {
      return;
    }
    try {
      await fetchUnreadCount(true);
      // Also refresh notifications for dropdown
      await fetchNotifications({ limit: 5, forceRefresh: true });
    } catch (error) {
      console.error('Immediate check error:', error);
    }
  }, [fetchUnreadCount, fetchNotifications, canUseNotifications]);

  // Start/stop polling based on active state
  useEffect(() => {
    if (canUseNotifications && isPollingActive) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [canUseNotifications, isPollingActive, startPolling, stopPolling]);

  // Pause polling when page is not visible to save resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPollingActive(false);
      } else {
        if (canUseNotifications) {
          setIsPollingActive(true);
          // Immediately check for new notifications when page becomes visible
          fetchUnreadCount(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount, canUseNotifications]);

  // Reset notifications when user logs out or auth is not ready
  useEffect(() => {
    if (!canUseNotifications) {
      // Stop polling and clear state to avoid showing stale data on public pages
      stopPolling();
      dispatch({ type: NOTIFICATION_ACTIONS.RESET_NOTIFICATIONS });
    }
  }, [canUseNotifications, stopPolling]);

  const value = {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    // filters: state.filters,
    pagination: state.pagination,
    lastFetch: state.lastFetch,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    // setFilters,
    loadMore,
    addNotification,
    smartRefresh,

    // Polling controls
    startPolling,
    stopPolling,
    triggerImmediateCheck,
    isPollingActive,

    // Utilities
    hasUnreadNotifications: state.unreadCount > 0,
    isFirstLoad: !state.lastFetch
  };



  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Default functions that never change
const defaultFunctions = {
  fetchNotifications: () => Promise.resolve(),
  fetchUnreadCount: () => Promise.resolve(),
  markAsRead: () => Promise.resolve(),
  markAsUnread: () => Promise.resolve(),
  markAllAsRead: () => Promise.resolve(),
  deleteNotification: () => Promise.resolve(),
  loadMore: () => {},
  addNotification: () => {},
  smartRefresh: () => Promise.resolve(),
  startPolling: () => {},
  stopPolling: () => {},
  triggerImmediateCheck: () => Promise.resolve(),
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);

  // Always return stable functions, even when context is not available
  const stableContext = {
    notifications: context?.notifications || [],
    unreadCount: context?.unreadCount || 0,
    loading: context?.loading || false,
    error: context?.error || null,
    pagination: context?.pagination || { page: 1, limit: 20, total: 0, hasMore: false },
    lastFetch: context?.lastFetch || null,
    hasUnreadNotifications: context?.hasUnreadNotifications || false,
    isFirstLoad: context?.isFirstLoad !== undefined ? context.isFirstLoad : true,
    // Always use stable functions - either from context or defaults
    fetchNotifications: context?.fetchNotifications || defaultFunctions.fetchNotifications,
    fetchUnreadCount: context?.fetchUnreadCount || defaultFunctions.fetchUnreadCount,
    markAsRead: context?.markAsRead || defaultFunctions.markAsRead,
    markAsUnread: context?.markAsUnread || defaultFunctions.markAsUnread,
    markAllAsRead: context?.markAllAsRead || defaultFunctions.markAllAsRead,
    deleteNotification: context?.deleteNotification || defaultFunctions.deleteNotification,
    loadMore: context?.loadMore || defaultFunctions.loadMore,
    addNotification: context?.addNotification || defaultFunctions.addNotification,
    smartRefresh: context?.smartRefresh || defaultFunctions.smartRefresh,

    // Polling controls
    startPolling: context?.startPolling || defaultFunctions.startPolling,
    stopPolling: context?.stopPolling || defaultFunctions.stopPolling,
    triggerImmediateCheck: context?.triggerImmediateCheck || defaultFunctions.triggerImmediateCheck,
    isPollingActive: context?.isPollingActive || false,
  };

  if (!context) {
    console.warn('useNotifications used outside NotificationProvider. Using default values.');
  }

  return stableContext;
};

// Hook for triggering notification checks after user actions
export const useNotificationTrigger = () => {
  const { triggerImmediateCheck } = useNotifications();

  // Call this after any user action that might create a notification
  const checkForNewNotifications = useCallback(async () => {
    // Wait a moment for the backend to process and create the notification
    setTimeout(async () => {
      await triggerImmediateCheck();
    }, 2000); // 2 second delay to allow backend processing
  }, [triggerImmediateCheck]);

  return { checkForNewNotifications };
};

export default NotificationContext;
