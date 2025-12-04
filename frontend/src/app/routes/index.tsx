import { createBrowserRouter, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Suspense } from 'react'

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

function ErrorBoundary() {
  const error = useRouteError()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
      <p className="mt-2 text-gray-600">
        {isRouteErrorResponse(error)
          ? `${error.status} ${error.statusText}`
          : error instanceof Error
          ? error.message
          : 'Unknown error'}
      </p>
    </div>
  )
}

const Loading = () => <div className="flex h-screen items-center justify-center">Loading...</div>

export const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<Loading />}>
        <ShellLayout />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
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
    element: (
      <Suspense fallback={<Loading />}>
        <TunnelLayout />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
    children: [{ index: true, element: <FutureTunnelPage /> }],
  },
])
