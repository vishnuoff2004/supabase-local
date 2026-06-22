import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';
import RoleBasedRedirect from './components/common/RoleBasedRedirect';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';
import CompleteProfilePage from './pages/auth/CompleteProfilePage';
import SearchPage from './pages/traveler/SearchPage';
import BookingPage from './pages/traveler/BookingPage';
import BookingHistoryPage from './pages/traveler/BookingHistoryPage';
import BookingDetailPage from './pages/traveler/BookingDetailPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import RouteManagementPage from './pages/driver/RouteManagementPage';
import BookingRequestsPage from './pages/driver/BookingRequestsPage';
import AgencyDashboardPage from './pages/agency/AgencyDashboardPage';
import DriverManagementPage from './pages/agency/DriverManagementPage';
import DriverRequestsPage from './pages/agency/DriverRequestsPage';
import BookingMonitorPage from './pages/agency/BookingMonitorPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AgencyManagementPage from './pages/admin/AgencyManagementPage';
import BookingOversightPage from './pages/admin/BookingOversightPage';
import UnauthorizedAccessPage from './pages/error/UnauthorizedAccessPage';
import SentryDebugPage from './pages/debug/SentryDebugPage';

const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const NotificationCenterPage = lazy(() => import('./pages/notifications/NotificationCenterPage'));

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/complete-profile" element={<CompleteProfilePage />} />
        <Route path="/debug/sentry" element={<SentryDebugPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/search" element={<RoleRoute roles={['traveler']}><SearchPage /></RoleRoute>} />
          <Route path="/bookings" element={<BookingHistoryPage />} />
          <Route path="/bookings/new" element={<BookingPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/analytics" element={
            <Suspense fallback={<div>Loading...</div>}>
              <RoleRoute roles={['admin', 'agency_admin']}><AnalyticsPage /></RoleRoute>
            </Suspense>
          } />
          <Route path="/events" element={
            <Suspense fallback={<div>Loading...</div>}>
              <EventsPage />
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={<div>Loading...</div>}>
              <NotificationCenterPage />
            </Suspense>
          } />
          <Route path="/driver/dashboard" element={<RoleRoute roles={['driver']}><DriverDashboardPage /></RoleRoute>} />
          <Route path="/driver/routes" element={<RoleRoute roles={['driver']}><RouteManagementPage /></RoleRoute>} />
          <Route path="/driver/requests" element={<RoleRoute roles={['driver']}><BookingRequestsPage /></RoleRoute>} />
          <Route path="/agency/dashboard" element={<RoleRoute roles={['agency_admin']}><AgencyDashboardPage /></RoleRoute>} />
          <Route path="/agency/drivers" element={<RoleRoute roles={['agency_admin']}><DriverManagementPage /></RoleRoute>} />
          <Route path="/agency/requests" element={<RoleRoute roles={['agency_admin']}><DriverRequestsPage /></RoleRoute>} />
          <Route path="/agency/bookings" element={<RoleRoute roles={['agency_admin']}><BookingMonitorPage /></RoleRoute>} />
          <Route path="/admin/dashboard" element={<RoleRoute roles={['admin']}><AdminDashboardPage /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute roles={['admin']}><UserManagementPage /></RoleRoute>} />
          <Route path="/admin/agencies" element={<RoleRoute roles={['admin']}><AgencyManagementPage /></RoleRoute>} />
          <Route path="/admin/bookings" element={<RoleRoute roles={['admin']}><BookingOversightPage /></RoleRoute>} />
          <Route path="/unauthorized" element={<UnauthorizedAccessPage />} />
        </Route>
      </Route>
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
