import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner text="Verifying session..." />;
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}

export default ProtectedRoute;
