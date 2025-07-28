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
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
    }
    setLoading(false);
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
      console.log('🔄 Logging out user...');

      // Call logout service to clear tokens
      await authService.logout();

      // Clear user state
      setUser(null);

      console.log('✅ Logout successful - redirecting to login');

      // Force redirect to login page
      window.location.href = '/login';

    } catch (error) {
      console.error('❌ Logout error:', error);

      // Even if logout fails, clear local state and redirect
      setUser(null);
      window.location.href = '/login';
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
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
