import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authenticationManager } from './AuthenticationManager';
import { UserRole } from './types';

interface RouteProps {
  children: React.ReactNode;
}

interface RoleRouteProps extends RouteProps {
  requiredRole: UserRole;
}

/**
 * Route protection: only accessible to authenticated users.
 */
export const PrivateRoute: React.FC<RouteProps> = ({ children }) => {
  const isAuthenticated = authenticationManager.validateSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * Route protection: only accessible to non-authenticated users (e.g. login/register pages).
 */
export const PublicOnlyRoute: React.FC<RouteProps> = ({ children }) => {
  const isAuthenticated = authenticationManager.validateSession();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * Route protection: only accessible to users with required role rank.
 */
export const RoleProtectedRoute: React.FC<RoleRouteProps> = ({ children, requiredRole }) => {
  const isAuthenticated = authenticationManager.validateSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasRole = authenticationManager.hasRole(requiredRole);
  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
