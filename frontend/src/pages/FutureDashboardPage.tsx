// import { useAuth } from '../features/auth/hooks/useAuth'
import { ChallengesPanel } from '../features/future-dashboard/components/ChallengesPanel'
import { KiteSummary } from '../features/future-dashboard/components/KiteSummary'
import { PercentileSummary } from '../features/future-dashboard/components/PercentileSummary'
import { useFutureDashboardData } from '../features/future-dashboard/hooks/useFutureDashboardData'

export function FutureDashboardPage() {
  // const { user } = useAuth()
  const {
    results,
    isLoadingResults,
    resultsError,
    challenges,
    isLoadingChallenges,
    challengesError,
  } = useFutureDashboardData()

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Future / Self</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--zen-text)]">Assessment Dashboard</h1>
            <p className="text-[var(--zen-text-muted)]">Review your latest kite coordinates and growth challenges.</p>
          </div>
          {isLoadingResults && <span className="text-sm text-[var(--zen-text-muted)]">Refreshing results…</span>}
        </div>
      </header>

      {/* Achievements section temporarily removed during Store refactor
      {user?.achievements && user.achievements.length > 0 && (
        <div className="rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--zen-text-muted)]">Recent Achievements</h3>
          <UserBadgeRow achievements={user.achievements} />
        </div>
      )}
      */}

      {resultsError && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{resultsError.message}</p>}
      <KiteSummary results={results} />
      <PercentileSummary results={results} />

      {challengesError && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{challengesError.message}</p>
      )}
      <ChallengesPanel challenges={challenges} isLoading={isLoadingChallenges} blindspots={results?.blindspots} />
    </section>
  )
}
