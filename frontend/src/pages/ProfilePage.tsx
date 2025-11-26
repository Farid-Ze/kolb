import { useAuth } from '../features/auth/hooks/useAuth'
// import { UserBadgeRow } from '../features/store/components/UserBadgeRow'

export function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <section className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Profile</p>
        <h1 className="text-2xl font-semibold">My Identity</h1>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6 rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--zen-accent)] text-2xl font-bold text-white">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--zen-text)]">{user.fullName}</h2>
              <p className="text-sm text-[var(--zen-text-muted)]">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-[var(--zen-bg)] p-3">
              <p className="text-xs uppercase text-[var(--zen-text-muted)]">Zen Points</p>
              <p className="text-lg font-semibold text-[var(--zen-text)]">{user.zenPoints ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[var(--zen-bg)] p-3">
              <p className="text-xs uppercase text-[var(--zen-text-muted)]">Level</p>
              <p className="text-lg font-semibold text-[var(--zen-text)]">{user.currentLvl ?? 1}</p>
            </div>
          </div>

          {user.lifeMotto && (
            <div className="rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4 italic text-[var(--zen-text-muted)]">
              "{user.lifeMotto}"
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[var(--zen-text)]">Badges & Achievements</h3>
          {/* <UserBadgeRow achievements={user.achievements} /> */}
          <p className="text-sm text-[var(--zen-text-muted)]">Achievements module temporarily disabled.</p>
        </div>
      </div>
    </section>
  )
}
