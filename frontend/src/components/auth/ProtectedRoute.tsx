import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import type { Role } from '../../contexts/auth.types';
import { LoadingComponent } from '../common/LoadingComponent';

/**
 * KLSI 4.0 - ProtectedRoute
 * Task 14: ProtectedRoute untuk menjaga rute yang memerlukan login
 * 
 * HOC untuk proteksi rute berdasarkan autentikasi dan role
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  allowedRoles?: Role[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/unauthorized',
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const acceptedRoles = allowedRoles ?? (requiredRole ? [requiredRole] : undefined);

  if (isLoading) {
    return <LoadingComponent message="Memverifikasi autentikasi..." />;
  }

  if (!isAuthenticated) {
    // Build returnTo URL from current location
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    // Redirect to login with both returnTo param and state for maximum compatibility
    return <Navigate to={`/auth/login?returnTo=${returnTo}`} state={{ from: location }} replace />;
  }

  // Check role jika diperlukan
  if (acceptedRoles && (!user?.role || !acceptedRoles.includes(user.role))) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
