import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const ProtectedRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Validate session when component mounts
    if (user && !loading) {
      const isValidSession = authService.validateSession();
      if (!isValidSession) {
        console.log('🔄 Invalid session detected, logging out');
        logout();
      }
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
