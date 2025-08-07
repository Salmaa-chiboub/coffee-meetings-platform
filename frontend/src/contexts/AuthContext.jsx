import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const refreshToken = localStorage.getItem('refresh_token');

        // Only validate if we have both user data and refresh token
        if (currentUser && refreshToken) {
          // Check if refresh token is still valid
          const { tokenUtils } = await import('../services/api');
          if (!tokenUtils.isTokenExpired(refreshToken)) {
            setUser(currentUser);
            console.log('✅ User session restored from localStorage');
          } else {
            console.log('🔄 Refresh token expired, clearing auth data');
            authService.logout();
          }
        } else {
          // Clear any incomplete auth data
          if (currentUser || refreshToken) {
            console.log('🔄 Incomplete auth data found, clearing');
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for automatic logout events from API interceptor
    const handleAutoLogout = () => {
      console.log('🔄 Received auto-logout event');
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAutoLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAutoLogout);
    };
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);

      // Auto-login after successful registration
      if (data.autoLogin && data.user) {
        setUser(data.user);
        console.log('✅ User auto-logged in after registration');
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Forcer la déconnexion même en cas d'erreur
      setUser(null);
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));

    // Update localStorage as well
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    setUser,
    logout,
    login,
    register,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
