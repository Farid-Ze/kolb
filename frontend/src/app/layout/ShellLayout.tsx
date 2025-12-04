import { LogOut, User } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { useAuthContext } from '../providers/AuthContext'

const links = [
  { to: '/future/dashboard', label: 'Dashboard' },
  { to: '/future/tunnel', label: 'Assessment' },
  { to: '/sphere', label: 'Sphere' },
  { to: '/admin', label: 'Admin', requireMediator: true },
]

export function ShellLayout() {
  const { isAuthenticated, isMediator, logout, remainingMs } = useAuthContext()

  const timeUntilLock = remainingMs ? Math.max(0, remainingMs - 45 * 60 * 1000) : 0
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Filter links based on auth state and role
  const visibleLinks = links.filter(link => {
    if (link.requireMediator) return isMediator
    return true
  })

  return (
    <div className="min-h-screen bg-[var(--zen-bg)] text-[var(--zen-text)]">
      {/* Header matching LandingPage style */}
      <header className="relative z-10 w-full border-b border-[var(--zen-border)] bg-[var(--zen-bg)]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo - matching LandingPage */}
          <Link to="/" className="group">
            <h1 className="font-headline text-xl font-bold tracking-tighter text-white group-hover:text-[var(--zen-accent)] transition-colors">
              ZENOTIKA<span className="text-[var(--zen-accent)]">™</span>
            </h1>
            <p className="font-ui text-[9px] uppercase tracking-[0.2em] text-[var(--zen-text-muted)]">
              Innovation Partner
            </p>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `font-ui text-xs uppercase tracking-widest transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : 'text-[var(--zen-text-muted)] hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {timeUntilLock > 0 && (
                  <span className="font-mono text-xs text-[var(--zen-text-muted)]" title="Session time remaining">
                    {formatTime(timeUntilLock)}
                  </span>
                )}
                <NavLink
                  to="/me"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      isActive
                        ? 'border-[var(--zen-accent)] text-[var(--zen-accent)]'
                        : 'border-[var(--zen-border)] text-[var(--zen-text-muted)] hover:border-[var(--zen-border-hover)] hover:text-white'
                    }`
                  }
                >
                  <User size={14} />
                  <span className="hidden sm:inline font-ui text-xs uppercase tracking-wider">Profile</span>
                </NavLink>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--zen-border)] text-[var(--zen-text-muted)] hover:border-red-500/50 hover:text-red-400 transition-all"
                  onClick={logout}
                  type="button"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline font-ui text-xs uppercase tracking-wider">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-5 py-2 rounded-full bg-[var(--zen-accent)] text-white font-ui text-xs uppercase tracking-wider hover:bg-[var(--zen-accent-hover)] transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
