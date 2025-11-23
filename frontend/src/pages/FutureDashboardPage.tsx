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
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Future / Self</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Assessment Dashboard</h1>
            <p className="text-slate-600">Review your latest kite coordinates and growth challenges.</p>
          </div>
          {isLoadingResults && <span className="text-sm text-slate-500">Refreshing results…</span>}
        </div>
      </header>

      {resultsError && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{resultsError.message}</p>}
      <KiteSummary results={results} />
      <PercentileSummary results={results} />

      {challengesError && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{challengesError.message}</p>
      )}
      <ChallengesPanel challenges={challenges} isLoading={isLoadingChallenges} />
    </section>
  )
}
