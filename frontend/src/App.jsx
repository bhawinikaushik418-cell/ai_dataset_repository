import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// User Pages
import DashboardPage from './pages/user/DashboardPage';
import DatasetRepositoryPage from './pages/user/DatasetRepositoryPage';
import DatasetDetailPage from './pages/user/DatasetDetailPage';
import UploadDatasetPage from './pages/user/UploadDatasetPage';
import MyUploadsPage from './pages/user/MyUploadsPage';
import MyDownloadsPage from './pages/user/MyDownloadsPage';
import AccessRequestsPage from './pages/user/AccessRequestsPage';
import AIRecommendationsPage from './pages/user/AIRecommendationsPage';
import ProfilePage from './pages/user/ProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import DatasetApprovalsPage from './pages/admin/DatasetApprovalsPage';
import AccessRequestsManagerPage from './pages/admin/AccessRequestsManagerPage';
import CategoryManagerPage from './pages/admin/CategoryManagerPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

import LoadingSpinner from './components/LoadingSpinner';

// Standard Page Layout (Navbar + Page Container + Footer)
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Workspace Layout with Sidebar
function WorkspaceLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}

// Protected Route Guard (Authentication required)
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Checking authentication status..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

// Admin Route Guard (ADMIN role strictly required)
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Verifying administrative privileges..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Top-Level Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/datasets" element={<DatasetRepositoryPage />} />
            <Route path="/datasets/:id" element={<DatasetDetailPage />} />
            <Route path="/recommendations" element={<AIRecommendationsPage />} />
          </Route>

          {/* Authenticated User Workspace Routes (Sidebar Layout) */}
          <Route
            element={
              <ProtectedRoute>
                <WorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadDatasetPage />} />
            <Route path="/my-uploads" element={<MyUploadsPage />} />
            <Route path="/my-downloads" element={<MyDownloadsPage />} />
            <Route path="/access-requests" element={<AccessRequestsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin Management Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <ManageUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <AdminRoute>
                  <DatasetApprovalsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/access-requests"
              element={
                <AdminRoute>
                  <AccessRequestsManagerPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <CategoryManagerPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AnalyticsPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
