import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingComponent } from '../common/LoadingComponent';

/**
 * KLSI 4.0 - ProtectedRoute
 * Task 14: ProtectedRoute untuk menjaga rute yang memerlukan login
 * 
 * HOC untuk proteksi rute berdasarkan autentikasi dan role
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'STUDENT' | 'MEDIATOR' | 'ADMIN';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingComponent message="Memverifikasi autentikasi..." />;
  }

  if (!isAuthenticated) {
    // Redirect ke login dengan state untuk kembali ke halaman ini setelah login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role jika diperlukan
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect ke unauthorized atau home jika role tidak sesuai
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
