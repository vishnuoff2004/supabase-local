import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function RoleBasedRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Loading..." />;

  const roleRoutes = {
    admin: '/admin/dashboard',
    agency_admin: '/agency/dashboard',
    driver: '/driver/dashboard',
    traveler: '/search',
  };

  const targetRoute = roleRoutes[user?.role] || '/search';
  return <Navigate to={targetRoute} replace />;
}

export default RoleBasedRedirect;
