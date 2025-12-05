import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'

import './index.css'
import { AppProviders } from './app/providers'
import { OpenAPI } from './shared/api/generated'
import { env } from './config/env'

// Import layouts (always needed)
import { ProtectedRoute } from './app/layout/ProtectedRoute'
import { PublicLayout } from './app/layout/PublicLayout'
import { ShellLayout } from './app/layout/ShellLayout'
import { TunnelLayout } from './app/layout/TunnelLayout'
import { PageLoader } from './shared/ui/PageLoader'

// Lazy load pages for better code splitting
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })))
const FutureDashboardPage = lazy(() => import('./pages/FutureDashboardPage').then(m => ({ default: m.FutureDashboardPage })))
const FutureTunnelPage = lazy(() => import('./pages/FutureTunnelPage').then(m => ({ default: m.FutureTunnelPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const SpherePage = lazy(() => import('./pages/SpherePage').then(m => ({ default: m.SpherePage })))

OpenAPI.BASE = env.API_URL

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public Layout - Landing & Auth (with SpeedTunnel background) */}
      <Route element={<PublicLayout />}>
        <Route index element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
        <Route path="/auth" element={<Suspense fallback={<PageLoader />}><AuthPage /></Suspense>} />
      </Route>

      {/* Shell Layout - Authenticated pages */}
      <Route element={<ShellLayout />}>
        <Route path="/future/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><FutureDashboardPage /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/sphere" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><SpherePage /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/me" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireMediator>
            <Suspense fallback={<PageLoader />}><AdminPage /></Suspense>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
      </Route>

      {/* Tunnel Layout - Full-screen assessment */}
      <Route path="/future/tunnel" element={<TunnelLayout />}>
        <Route index element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><FutureTunnelPage /></Suspense>
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
