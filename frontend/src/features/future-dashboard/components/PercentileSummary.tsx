import type { AssessmentResults } from '../../../entities/result/model'

interface PercentileSummaryProps {
  results?: AssessmentResults
}

export function PercentileSummary({ results }: PercentileSummaryProps) {
  if (!results?.percentiles || Object.keys(results.percentiles).length === 0) {
    return null
  }

  const entries = Object.entries(results.percentiles).filter((entry): entry is [string, number] =>
    typeof entry[1] === 'number',
  )

  if (entries.length === 0) {
    return null
  }

  return (
    <section className="space-y-4 rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--zen-text-muted)]">Percentiles</p>
          <h2 className="text-xl font-semibold text-[var(--zen-text)]">Norm Group Comparison</h2>
        </div>
      </div>
      <ul className="space-y-3">
        {entries.map(([dimension, value]) => (
          <li key={dimension}>
            <div className="flex items-center justify-between text-sm font-medium text-[var(--zen-text)]">
              <span>{dimension}</span>
              <span>{value.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[var(--zen-bg)]">
              <div className="h-full rounded-full bg-[var(--zen-accent)]" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
