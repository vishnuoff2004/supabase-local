import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Verifying access..." />;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/search" replace />;
  }

  return children;
}

export default RoleRoute;
