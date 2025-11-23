import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'

import type { AssessmentResults } from '../../../entities/result/model'

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

  const chartData = results.kiteCoordinates
    ? [
        { subject: 'CE', A: results.kiteCoordinates.CE ?? 0, fullMark: 40 },
        { subject: 'RO', A: results.kiteCoordinates.RO ?? 0, fullMark: 40 },
        { subject: 'AC', A: results.kiteCoordinates.AC ?? 0, fullMark: 40 },
        { subject: 'AE', A: results.kiteCoordinates.AE ?? 0, fullMark: 40 },
      ]
    : []

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
        {results.kiteCoordinates && (
          <section className="flex flex-col items-center justify-center">
            <div className="h-[300px] w-full max-w-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="var(--zen-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--zen-text-muted)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 40]} tick={false} axisLine={false} />
                  <Radar
                    name="Learning Style"
                    dataKey="A"
                    stroke="var(--zen-accent)"
                    fill="var(--zen-accent)"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <dl className="mt-4 grid grid-cols-4 gap-4 text-center">
              {Object.entries(results.kiteCoordinates).map(([dimension, value]) => (
                <div key={dimension}>
                  <dt className="text-xs uppercase text-[var(--zen-text-muted)]">{dimension}</dt>
                  <dd className="text-sm font-semibold text-[var(--zen-text)]">{value.toFixed(0)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--zen-text-muted)]">Strengths</h3>
            <ul className="mt-2 space-y-2 text-sm text-[var(--zen-text)]">
              {results.strengths.length > 0 ? (
                results.strengths.map((item) => (
                  <li key={item} className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-900">
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-[var(--zen-text-muted)]">No strengths recorded.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--zen-text-muted)]">Blindspots</h3>
            <ul className="mt-2 space-y-2 text-sm text-[var(--zen-text)]">
              {results.blindspots.length > 0 ? (
                results.blindspots.map((item) => (
                  <li key={item} className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-amber-900">
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-[var(--zen-text-muted)]">No blindspots detected.</li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
