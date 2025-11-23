import { Outlet } from 'react-router-dom'

export function TunnelLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Outlet />
    </div>
  )
}
