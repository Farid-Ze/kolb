import { memo, useMemo } from 'react'
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

// Memoized tooltip style to prevent recreation on each render
const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  borderColor: '#334155',
  color: '#f1f5f9',
  borderRadius: '0.5rem',
}

const ITEM_STYLE = { color: '#f1f5f9' }

export const KiteChart = memo(function KiteChart({ results }: KiteChartProps) {
  const coords = results.kiteCoordinates
  
  const data = useMemo(() => {
    if (!coords) return null
    return [
      { subject: 'CE', A: coords.CE ?? 0, fullMark: 100 },
      { subject: 'RO', A: coords.RO ?? 0, fullMark: 100 },
      { subject: 'AC', A: coords.AC ?? 0, fullMark: 100 },
      { subject: 'AE', A: coords.AE ?? 0, fullMark: 100 },
    ]
  }, [coords])

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-gray-400">
        No chart data available
      </div>
    )
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <RadarChart cx="50%" cy="50%" data={data} outerRadius="80%">
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={false} />
          <Radar
            dataKey="A"
            fill="#3B82F6"
            fillOpacity={0.4}
            name="Percentile"
            stroke="#3B82F6"
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={ITEM_STYLE}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
})
