import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import QueryProvider from './contexts/QueryProvider';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/DashboardSimple';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Campaigns from './pages/Campaigns';
import Employees from './pages/Employees';
import Settings from './pages/Settings';

// Component to handle dashboard route based on authentication
const DashboardRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6F47] mx-auto"></div>
          <p className="mt-4 text-warmGray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return user ? (
    <Layout>
      <Dashboard />
    </Layout>
  ) : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Landing page - public route */}
            <Route path="/" element={<LandingPage />} />

            {/* Public auth routes - without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes - with layout and protection */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardRoute />
              </ProtectedRoute>
            } />

            <Route path="/campaigns/*" element={
              <ProtectedRoute>
                <Layout>
                  <Campaigns />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/employees/*" element={
              <ProtectedRoute>
                <Layout>
                  <Employees />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Catch all route - redirect to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
