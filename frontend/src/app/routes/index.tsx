import { createBrowserRouter } from 'react-router-dom'

import { TunnelLayout } from '../layout/TunnelLayout'
import { ShellLayout } from '../layout/ShellLayout'
import { AdminPage } from '../../pages/AdminPage'
import { AuthPage } from '../../pages/AuthPage'
import { FutureDashboardPage } from '../../pages/FutureDashboardPage'
import { FutureTunnelPage } from '../../pages/FutureTunnelPage'
import { LandingPage } from '../../pages/LandingPage'
import { NotFoundPage } from '../../pages/NotFoundPage'
import { ProfilePage } from '../../pages/ProfilePage'
import { SpherePage } from '../../pages/SpherePage'

export const router = createBrowserRouter([
  {
    element: <ShellLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: '/future/dashboard', element: <FutureDashboardPage /> },
      { path: '/sphere', element: <SpherePage /> },
      { path: '/me', element: <ProfilePage /> },
      { path: '/admin', element: <AdminPage /> },
      { path: '/auth', element: <AuthPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/future/tunnel',
    element: <TunnelLayout />,
    children: [{ index: true, element: <FutureTunnelPage /> }],
  },
])
