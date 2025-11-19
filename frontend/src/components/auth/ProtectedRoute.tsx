import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type Role } from '../../contexts/AuthContext';
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
    // Redirect ke login dengan state untuk kembali ke halaman ini setelah login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role jika diperlukan
  if (acceptedRoles && (!user?.role || !acceptedRoles.includes(user.role))) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
