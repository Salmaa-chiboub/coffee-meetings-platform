import React, { createContext, useContext, useReducer, useCallback, useState, useRef } from 'react';
import { notificationAPI } from '../services/notificationService';

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

  // Use ref to access current state without causing re-renders
  const stateRef = useRef(state);
  stateRef.current = state;

  // Fetch notifications
  const fetchNotifications = useCallback(async (options = {}) => {
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.SET_LOADING, payload: true });

      const currentState = stateRef.current;
      const params = {
        page: options.page || currentState.pagination.page,
        limit: options.limit || currentState.pagination.limit,
        ...currentState.filters,
        ...options.filters
      };

      const result = await notificationAPI.getNotifications(params);

      if (result.success) {
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
          payload: {
            notifications: options.append ? [...currentState.notifications, ...result.data.results] : result.data.results,
            unreadCount: result.data.unread_count,
            pagination: {
              page: result.data.page,
              total: result.data.total,
              hasMore: result.data.has_more
            }
          }
        });
      } else {
        console.error('Failed to fetch notifications:', result.error);
        dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: result.error });
      }
    } catch (error) {
      console.error('Notification API error:', error.message);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []); // No dependencies - function is stable

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await notificationAPI.getUnreadCount();
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: result.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationAPI.markAsRead(notificationId);
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_READ, payload: notificationId });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }, []);

  // Mark notification as unread
  const markAsUnread = useCallback(async (notificationId) => {
    try {
      const result = await notificationAPI.markAsUnread(notificationId);
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_AS_UNREAD, payload: notificationId });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationAPI.markAllAsRead();
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const result = await notificationAPI.deleteNotification(notificationId);
      if (result.success) {
        dispatch({ type: NOTIFICATION_ACTIONS.REMOVE_NOTIFICATION, payload: notificationId });
      }
      return result.success;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }, []);



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
  };

  if (!context) {
    console.warn('useNotifications used outside NotificationProvider. Using default values.');
  }

  return stableContext;
};

export default NotificationContext;
