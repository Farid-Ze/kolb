import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'

import './index.css'
import { AppProviders } from './app/providers'
import { OpenAPI } from './shared/api/generated'
import { env } from './config/env'

// Import pages and layouts
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
console.log('OpenAPI.BASE configured as:', OpenAPI.BASE)

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<ShellLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/future/dashboard" element={<FutureDashboardPage />} />
        <Route path="/sphere" element={<SpherePage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/future/tunnel" element={<TunnelLayout />}>
        <Route index element={<FutureTunnelPage />} />
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
