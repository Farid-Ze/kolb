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
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Percentiles</p>
          <h2 className="text-xl font-semibold text-slate-900">Norm Group Comparison</h2>
        </div>
      </div>
      <ul className="space-y-3">
        {entries.map(([dimension, value]) => (
          <li key={dimension}>
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>{dimension}</span>
              <span>{value.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
