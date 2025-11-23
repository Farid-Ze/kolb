import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

export function TunnelLayout() {
  const location = useLocation()

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [location])

  return (
    <div className="min-h-screen bg-[var(--zen-bg)] text-[var(--zen-text)]">
      <Outlet />
    </div>
  )
}
