import { useAuth } from '../features/auth/hooks/useAuth'

export function ProfilePage() {
  const { user } = useAuth()

  // User is guaranteed by ProtectedRoute, but handle edge case
  if (!user) {
    return <div className="py-10 text-center text-[var(--zen-text-muted)]">Loading profile...</div>
  }

  return (
    <section className="space-y-8">
      <header>
        <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Profile</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[var(--zen-text)]">My Identity</h1>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--zen-accent)] to-[var(--zen-accent-hover)] text-2xl font-bold text-white shadow-lg shadow-[var(--zen-accent)]/25">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--zen-text)]">{user.fullName}</h2>
              <p className="text-sm text-[var(--zen-text-muted)]">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-[var(--zen-bg)] p-4 border border-white/5">
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Zen Points</p>
              <p className="mt-1 text-2xl font-bold text-[var(--zen-accent)]">{user.zenPoints ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[var(--zen-bg)] p-4 border border-white/5">
              <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Level</p>
              <p className="mt-1 text-2xl font-bold text-[var(--zen-text)]">{user.currentLvl ?? 1}</p>
            </div>
          </div>

          {user.lifeMotto && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 italic text-[var(--zen-text-muted)]">
              "{user.lifeMotto}"
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg font-medium text-[var(--zen-text)]">Badges & Achievements</h3>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-sm text-[var(--zen-text-muted)]">Coming soon.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
