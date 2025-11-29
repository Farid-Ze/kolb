import { Routes, Route } from 'react-router-dom'

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
  return (
    <Routes>
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
    </Routes>
  )
}
