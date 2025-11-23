import { NavLink, Outlet } from 'react-router-dom'

import { useAuthContext } from '../providers/AuthContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/future/dashboard', label: 'Future' },
  { to: '/sphere', label: 'Sphere' },
  { to: '/store', label: 'Store' },
  { to: '/admin', label: 'Admin' },
]

export function ShellLayout() {
  const { isAuthenticated, logout } = useAuthContext()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-semibold tracking-wide">Zenotika</span>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex gap-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `transition-colors hover:text-slate-900 ${isActive ? 'text-slate-900' : 'text-slate-500'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            {isAuthenticated ? (
              <button
                className="rounded-md border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `rounded-md border px-3 py-1 transition ${
                    isActive ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`
                }
              >
                Sign In
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
