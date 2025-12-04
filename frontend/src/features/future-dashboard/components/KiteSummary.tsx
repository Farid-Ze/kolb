import type { AssessmentResults } from '../model'
import { KiteChart } from './KiteChart'
import { StrengthsBlindspots } from './StrengthsBlindspots'

interface KiteSummaryProps {
  results?: AssessmentResults
}

export function KiteSummary({ results }: KiteSummaryProps) {
  if (!results) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <p className="text-sm text-[var(--zen-text-muted)]">No finalized session yet. Complete the future tunnel to unlock insights.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Latest Session</p>
          <h2 className="font-display text-xl font-semibold text-[var(--zen-text)]">Session #{results.sessionId}</h2>
        </div>
        {results.lfiScore !== undefined && results.lfiScore !== null && (
          <div className="rounded-lg border border-[var(--zen-accent)]/30 bg-[var(--zen-accent)]/10 px-4 py-2 text-[var(--zen-accent)]">
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
