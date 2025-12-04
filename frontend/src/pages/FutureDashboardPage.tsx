import { ChallengesPanel } from '../features/future-dashboard/components/ChallengesPanel'
import { KiteSummary } from '../features/future-dashboard/components/KiteSummary'
import { PercentileSummary } from '../features/future-dashboard/components/PercentileSummary'
import { useFutureDashboardData } from '../features/future-dashboard/hooks/useFutureDashboardData'

export function FutureDashboardPage() {
  const {
    results,
    isLoadingResults,
    resultsError,
    challenges,
    isLoadingChallenges,
    challengesError,
  } = useFutureDashboardData()

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Future / Self</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--zen-text)]">Assessment Dashboard</h1>
            <p className="mt-1 text-[var(--zen-text-muted)]">Review your latest kite coordinates and growth challenges.</p>
          </div>
          {isLoadingResults && <span className="text-sm text-[var(--zen-accent)]">Refreshing results…</span>}
        </div>
      </header>

      {resultsError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {resultsError.message}
        </p>
      )}
      <KiteSummary results={results} />
      <PercentileSummary results={results} />

      {challengesError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {challengesError.message}
        </p>
      )}
      <ChallengesPanel challenges={challenges} isLoading={isLoadingChallenges} blindspots={results?.blindspots} />
    </section>
  )
}
