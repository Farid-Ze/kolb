import { Navigate, useLocation } from 'react-router-dom'

import { useAuthContext } from '../providers/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If true, requires user to be a mediator (admin) */
  requireMediator?: boolean
}

/**
 * Route guard component that redirects unauthenticated users to /auth.
 * Shows nothing while auth state is loading to prevent flash.
 */
export function ProtectedRoute({ children, requireMediator = false }: ProtectedRouteProps) {
  const { isAuthenticated, isMediator, isLoading } = useAuthContext()
  const location = useLocation()

  // Show nothing while loading to prevent flash of redirect
  if (isLoading) {
    return null
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // If mediator is required but user is not mediator, redirect to home
  if (requireMediator && !isMediator) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
