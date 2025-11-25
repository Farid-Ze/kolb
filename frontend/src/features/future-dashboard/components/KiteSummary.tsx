import type { AssessmentResults } from '../model'
import { KiteChart } from './KiteChart'
import { StrengthsBlindspots } from './StrengthsBlindspots'

interface KiteSummaryProps {
  results?: AssessmentResults
}

export function KiteSummary({ results }: KiteSummaryProps) {
  if (!results) {
    return (
      <div className="rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6 shadow-sm">
        <p className="text-sm text-[var(--zen-text-muted)]">No finalized session yet. Complete the future tunnel to unlock insights.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--zen-text-muted)]">Latest Session</p>
          <h2 className="text-xl font-semibold text-[var(--zen-text)]">Session #{results.sessionId}</h2>
        </div>
        {results.lfiScore !== undefined && results.lfiScore !== null && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-indigo-900">
            LFI Score: <span className="font-semibold">{results.lfiScore.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col items-center justify-center">
          {results.kiteCoordinates && (
            <KiteChart results={results} />
          )}
        </section>

        <section className="space-y-6">
          <StrengthsBlindspots results={results} />
        </section>
      </div>
    </div>
  )
}
