import { Moon, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useAuthContext } from '../providers/AuthContext'
import { useTheme } from '../providers/ThemeContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/future/dashboard', label: 'Future' },
  { to: '/sphere', label: 'Sphere' },
  { to: '/store', label: 'Store' },
  { to: '/admin', label: 'Admin' },
]

export function ShellLayout() {
  const { isAuthenticated, logout, remainingMs } = useAuthContext()
  const { theme, preference, setPreference, toggleTheme } = useTheme()

  const timeUntilLock = remainingMs ? Math.max(0, remainingMs - 45 * 60 * 1000) : 0
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[var(--zen-bg)] text-[var(--zen-text)]">
      <Toaster position="top-center" richColors />
      <header className="border-b border-[var(--zen-border)] bg-[var(--zen-bg-elevated)]">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-semibold tracking-wide text-[var(--zen-text)]">Zenotika</span>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex gap-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `transition-colors text-[var(--zen-text)] hover:opacity-100 ${
                      isActive ? 'opacity-100' : 'opacity-70'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="theme-preference">
                Theme preference
              </label>
              <select
                id="theme-preference"
                className="rounded-md border border-[var(--zen-border)] bg-transparent px-2 py-1 text-xs uppercase tracking-wide text-[var(--zen-text)]"
                value={preference}
                onChange={(event) => setPreference(event.target.value as typeof preference)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <button
                className="flex items-center gap-2 rounded-full border border-[var(--zen-border)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--zen-text)] transition hover:border-[color:var(--zen-accent)]"
                onClick={toggleTheme}
                type="button"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span className="hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
              </button>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {timeUntilLock > 0 && (
                  <span className="text-xs font-mono text-[var(--zen-text-muted)]" title="Time remaining before session lock">
                    {formatTime(timeUntilLock)}
                  </span>
                )}
                <button
                  className="rounded-md border border-[var(--zen-border)] px-3 py-1 text-[var(--zen-text)] transition hover:border-[color:var(--zen-accent)]"
                  onClick={logout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `rounded-md border px-3 py-1 transition ${
                    isActive
                      ? 'border-[color:var(--zen-accent)] text-[var(--zen-text)]'
                      : 'border-[var(--zen-border)] text-[var(--zen-text)] hover:border-[color:var(--zen-accent)]'
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
