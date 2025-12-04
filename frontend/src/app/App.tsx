import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'

import { telemetry } from '../shared/telemetry'
import { ProtectedRoute } from './layout/ProtectedRoute'
import { ShellLayout } from './layout/ShellLayout'
import { TunnelLayout } from './layout/TunnelLayout'
import { AdminPage } from '../pages/AdminPage'
import { AuthPage } from '../pages/AuthPage'
import { FutureDashboardPage } from '../pages/FutureDashboardPage'
import { FutureTunnelPage } from '../pages/FutureTunnelPage'
import { LandingPage } from '../pages/LandingPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { SpherePage } from '../pages/SpherePage'

export default function App() {
  // Cleanup telemetry batcher on app unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      telemetry.destroy()
    }
  }, [])

  return (
    <Routes>
      <Route element={<ShellLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/future/dashboard" element={
          <ProtectedRoute>
            <FutureDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/sphere" element={
          <ProtectedRoute>
            <SpherePage />
          </ProtectedRoute>
        } />
        <Route path="/me" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireMediator>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/future/tunnel" element={<TunnelLayout />}>
        <Route index element={
          <ProtectedRoute>
            <FutureTunnelPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}
