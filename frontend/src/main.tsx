import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'

import './index.css'
import { AppProviders } from './app/providers'
import { OpenAPI } from './shared/api/generated'
import { env } from './config/env'

// Import pages and layouts
import { ProtectedRoute } from './app/layout/ProtectedRoute'
import { ShellLayout } from './app/layout/ShellLayout'
import { TunnelLayout } from './app/layout/TunnelLayout'
import { AdminPage } from './pages/AdminPage'
import { AuthPage } from './pages/AuthPage'
import { FutureDashboardPage } from './pages/FutureDashboardPage'
import { FutureTunnelPage } from './pages/FutureTunnelPage'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { SpherePage } from './pages/SpherePage'

OpenAPI.BASE = env.API_URL

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
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
    </>
  )
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
