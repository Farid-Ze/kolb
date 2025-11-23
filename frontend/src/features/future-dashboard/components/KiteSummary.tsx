import type { AssessmentResults } from '../../../entities/result/model'

interface KiteSummaryProps {
  results?: AssessmentResults
}

export function KiteSummary({ results }: KiteSummaryProps) {
  if (!results) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">No finalized session yet. Complete the future tunnel to unlock insights.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Latest Session</p>
          <h2 className="text-xl font-semibold text-slate-900">Session #{results.sessionId}</h2>
        </div>
        {results.lfiScore !== undefined && results.lfiScore !== null && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-indigo-900">
            LFI Score: <span className="font-semibold">{results.lfiScore.toFixed(2)}</span>
          </div>
        )}
      </div>
      {results.kiteCoordinates && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Kite Coordinates</h3>
          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
            {Object.entries(results.kiteCoordinates).map(([dimension, value]) => (
              <div key={dimension} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <dt className="text-xs uppercase text-slate-500">{dimension}</dt>
                <dd className="text-lg font-semibold text-slate-900">{value.toFixed(2)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Strengths</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {results.strengths.length > 0 ? (
              results.strengths.map((item) => (
                <li key={item} className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-900">
                  {item}
                </li>
              ))
            ) : (
              <li className="text-slate-400">No strengths recorded.</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Blindspots</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {results.blindspots.length > 0 ? (
              results.blindspots.map((item) => (
                <li key={item} className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-amber-900">
                  {item}
                </li>
              ))
            ) : (
              <li className="text-slate-400">No blindspots detected.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}
