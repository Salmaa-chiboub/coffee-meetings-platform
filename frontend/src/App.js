import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import QueryProvider from './contexts/QueryProvider';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { SkeletonDashboard, SkeletonCard } from './components/ui/Skeleton';

// Eager load critical components (auth pages)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Campaigns from './pages/Campaigns';
import CampaignWorkflow from './pages/CampaignWorkflow';
import CampaignHistory from './pages/CampaignHistory';
import GlobalCampaignHistory from './pages/GlobalCampaignHistory';
import CampaignEvaluations from './pages/CampaignEvaluations';
import CampaignEvaluationsView from './pages/CampaignEvaluationsView';
import LandingPage from './pages/LandingPage';
import PublicEvaluation from './components/evaluation/PublicEvaluation';

// Lazy load heavy components for code splitting
const Dashboard = lazy(() => import('./pages/DashboardModern'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CampaignWorkflow = lazy(() => import('./pages/CampaignWorkflow'));
const CampaignHistory = lazy(() => import('./pages/CampaignHistory'));
const CampaignEvaluations = lazy(() => import('./pages/CampaignEvaluations'));
const CampaignEvaluationsView = lazy(() => import('./pages/CampaignEvaluationsView'));
const Employees = lazy(() => import('./pages/Employees'));
const Settings = lazy(() => import('./pages/Settings'));



function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public evaluation route - no authentication required */}
            <Route path="/evaluation/:token" element={<PublicEvaluation />} />

            {/* Landing page as default route */}
            <Route path="/" element={<LandingPage />} />

            {/* Public auth routes - without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes - with layout and protection */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<SkeletonDashboard />}>
                    <Dashboard />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/campaigns/*" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={
                    <div className="max-w-7xl mx-auto p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <SkeletonCard key={i} />
                        ))}
                      </div>
                    </div>
                  }>
                    <Campaigns />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/campaigns/:id/workflow" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<SkeletonDashboard />}>
                    <CampaignWorkflow />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/campaigns/history" element={
              <ProtectedRoute>
                <Layout>
                  <GlobalCampaignHistory />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/campaigns/:id/history" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<SkeletonDashboard />}>
                    <CampaignHistory />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/campaigns/:id/evaluations" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<SkeletonDashboard />}>
                    <CampaignEvaluations />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/campaigns/:id/feedback" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<SkeletonDashboard />}>
                    <CampaignEvaluationsView />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/employees/*" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<SkeletonDashboard />}>
                    <Employees />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<SkeletonDashboard />}>
                    <Settings />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Catch all route - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
