import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import QueryProvider from './contexts/QueryProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { SkeletonDashboard } from './components/ui/Skeleton';

// Eager load critical components
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import PublicEvaluation from './components/evaluation/PublicEvaluation';

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/DashboardModern'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CampaignWorkflow = lazy(() => import('./pages/CampaignWorkflow'));
const CampaignHistory = lazy(() => import('./pages/CampaignHistory'));
const CampaignEvaluations = lazy(() => import('./pages/CampaignEvaluations'));
const Employees = lazy(() => import('./pages/Employees'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const GlobalHistory = lazy(() => import('./pages/GlobalHistory'));
const GlobalCampaignHistory = lazy(() => import('./pages/GlobalCampaignHistory'));

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/evaluation/:token" element={<PublicEvaluation />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<SkeletonDashboard />}>
                      <Dashboard />
                    </Suspense>
                  }
                />

                <Route path="campaigns/*">
                  <Route
                    index
                    element={
                      <Suspense fallback={<SkeletonDashboard />}>
                        <Campaigns />
                      </Suspense>
                    }
                  />
                  <Route
                    path=":id/workflow"
                    element={
                      <Suspense fallback={<SkeletonDashboard />}>
                        <CampaignWorkflow />
                      </Suspense>
                    }
                  />
                  <Route
                    path=":id/history"
                    element={
                      <Suspense fallback={<SkeletonDashboard />}>
                        <CampaignHistory />
                      </Suspense>
                    }
                  />
                  <Route
                    path=":id/evaluations"
                    element={
                      <Suspense fallback={<SkeletonDashboard />}>
                        <CampaignEvaluations />
                      </Suspense>
                    }
                  />
                </Route>

                <Route
                  path="employees/*"
                  element={
                    <Suspense fallback={<SkeletonDashboard />}>
                      <Employees />
                    </Suspense>
                  }
                />

                <Route path="history/*">
                  <Route
                    index
                    element={
                      <Suspense fallback={<SkeletonDashboard />}>
                        <GlobalHistory />
                      </Suspense>
                    }
                  />
                  <Route
                    path="campaigns"
                    element={
                      <Suspense fallback={<SkeletonDashboard />}>
                        <GlobalCampaignHistory />
                      </Suspense>
                    }
                  />
                </Route>

                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<SkeletonDashboard />}>
                      <Settings />
                    </Suspense>
                  }
                />

                <Route
                  path="notifications"
                  element={
                    <Suspense fallback={<SkeletonDashboard />}>
                      <Notifications />
                    </Suspense>
                  }
                />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
