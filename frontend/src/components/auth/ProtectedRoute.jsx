import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const ProtectedRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('🔍 ProtectedRoute Debug:', {
    user: user ? { id: user.id, email: user.email } : null,
    loading,
    pathname: location.pathname,
    hasAccessToken: !!localStorage.getItem('access_token'),
    hasRefreshToken: !!localStorage.getItem('refresh_token')
  });

  useEffect(() => {
    // Validate session when component mounts - but only check basic requirements
    if (user && !loading) {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      // Only logout if we have no tokens at all
      if (!accessToken && !refreshToken) {
        console.log('🔄 No authentication tokens found, logging out');
        logout();
      }
      // If we have at least one token, let the API interceptor handle token refresh
    }
  }, [user, loading, logout]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6F47] mx-auto"></div>
          <p className="mt-4 text-warmGray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
