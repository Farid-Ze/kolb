import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import type { AssessmentResults } from '../model'

interface KiteChartProps {
  results: AssessmentResults
}

export function KiteChart({ results }: KiteChartProps) {
  const coords = results.kiteCoordinates
  if (!coords) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 text-slate-400">
        No chart data available
      </div>
    )
  }

  // Transform coordinates for Recharts Radar
  // KLSI 4.0 Kite is typically 4 axes: CE (North), RO (East), AC (South), AE (West)
  // But the backend might return them as N, E, S, W or specific labels.
  // Let's assume standard KLSI axes.
  const data = [
    { subject: 'CE', A: coords.CE ?? 0, fullMark: 100 },
    { subject: 'RO', A: coords.RO ?? 0, fullMark: 100 },
    { subject: 'AC', A: coords.AC ?? 0, fullMark: 100 },
    { subject: 'AE', A: coords.AE ?? 0, fullMark: 100 },
  ]

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <RadarChart cx="50%" cy="50%" data={data} outerRadius="80%">
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={false} />
          <Radar
            dataKey="A"
            fill="var(--zen-primary)"
            fillOpacity={0.4}
            name="Percentile"
            stroke="var(--zen-primary)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              borderColor: '#334155',
              color: '#f1f5f9',
              borderRadius: '0.5rem',
            }}
            itemStyle={{ color: '#f1f5f9' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
