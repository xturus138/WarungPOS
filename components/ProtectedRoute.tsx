
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  role: Role;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin has access to all roles, Cashier only to Cashier
  const hasAccess = user.role === 'ADMIN' || user.role === role;

  if (!hasAccess) {
     // Redirect to their default page if they try to access a page they don't have permission for
     const defaultPath = user.role === 'ADMIN' ? '/admin' : '/pos';
     return <Navigate to={defaultPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
