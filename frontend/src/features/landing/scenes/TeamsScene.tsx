/**
 * TEAMS SCENE (65% - 82%)
 * 
 * Collective intelligence. Organizational analytics.
 * 
 * Citrix Layered Information:
 * - Eyebrow: "TEAMS"
 * - Headline: "COLLECTIVE INTELLIGENCE"
 * - Visual labels: Scatter plot with individual kite shapes
 * - Data overlay: Team diversity metrics
 * - Hotspot: "Explore Teams" CTA
 * - Fact: "Turn diversity into strength"
 * 
 * Animation:
 * - 65-70%: Scene enters, scatter plot draws
 * - 70-78%: Individual kites animate in, labels appear
 * - 78-82%: Metrics reveal, transition to next
 */

import { memo } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface TeamsSceneProps {
  progress: MotionValue<number>
  reduced?: boolean | null
}

// ═══════════════════════════════════════════════════════════════════
// TEAM MEMBERS DATA (Simulated scatter positions)
// ═══════════════════════════════════════════════════════════════════

const TEAM_MEMBERS = [
  { id: 'a', x: 25, y: 30, style: 'Diverging', color: '#3B82F6' },
  { id: 'b', x: 45, y: 20, style: 'Assimilating', color: '#8B5CF6' },
  { id: 'c', x: 70, y: 35, style: 'Converging', color: '#10B981' },
  { id: 'd', x: 35, y: 60, style: 'Accommodating', color: '#F59E0B' },
  { id: 'e', x: 60, y: 55, style: 'Diverging', color: '#3B82F6' },
  { id: 'f', x: 55, y: 75, style: 'Converging', color: '#10B981' },
  { id: 'g', x: 20, y: 70, style: 'Assimilating', color: '#8B5CF6' },
  { id: 'h', x: 80, y: 65, style: 'Accommodating', color: '#F59E0B' },
]

// ═══════════════════════════════════════════════════════════════════
// SCATTER VISUALIZATION
// ═══════════════════════════════════════════════════════════════════

const ScatterVisualization = memo(function ScatterVisualization({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.65, 0.70, 0.80, 0.82], [0, 1, 1, 0])
  
  return (
    <m.div 
      className="relative w-[min(70vw,500px)] h-[min(60vw,400px)]"
      style={{ opacity }}
    >
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Quadrant grid */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
        
        {/* Subtle grid lines */}
        {[25, 75].map((pos) => (
          <g key={pos}>
            <line x1={pos} y1="0" x2={pos} y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
            <line x1="0" y1={pos} x2="100" y2={pos} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
          </g>
        ))}
      </svg>
      
      {/* Team member kites */}
      {TEAM_MEMBERS.map((member, i) => (
        <TeamMemberKite
          key={member.id}
          member={member}
          index={i}
          progress={progress}
        />
      ))}
      
      {/* Axis labels */}
      <AxisLabels progress={progress} />
      
      {/* Quadrant labels */}
      <QuadrantLabels progress={progress} />
    </m.div>
  )
})

const TeamMemberKite = memo(function TeamMemberKite({
  member,
  index,
  progress,
}: {
  member: typeof TEAM_MEMBERS[number]
  index: number
  progress: MotionValue<number>
}) {
  const delay = index * 0.008
  const opacity = useTransform(
    progress, 
    [0.68 + delay, 0.72 + delay, 0.80, 0.82], 
    [0, 1, 1, 0]
  )
  const scale = useTransform(progress, [0.68 + delay, 0.72 + delay], [0, 1])
  
  return (
    <m.div
      className="absolute flex flex-col items-center"
      style={{
        left: `${member.x}%`,
        top: `${member.y}%`,
        transform: 'translate(-50%, -50%)',
        opacity,
        scale,
      }}
    >
      {/* Mini kite shape */}
      <svg width="24" height="24" viewBox="0 0 24 24" className="drop-shadow-lg">
        <path
          d="M 12 2 L 22 12 L 12 22 L 2 12 Z"
          fill={`${member.color}30`}
          stroke={member.color}
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="2" fill={member.color} />
      </svg>
    </m.div>
  )
})

const AxisLabels = memo(function AxisLabels({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const labelOpacity = useTransform(progress, [0.72, 0.76, 0.80, 0.82], [0, 1, 1, 0])
  
  return (
    <>
      {/* Top: Abstract */}
      <m.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 text-center"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-ui">
          Abstract
        </span>
      </m.div>
      
      {/* Bottom: Concrete */}
      <m.div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-center"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-ui">
          Concrete
        </span>
      </m.div>
      
      {/* Left: Active */}
      <m.div 
        className="absolute left-0 top-1/2 -translate-x-6 -translate-y-1/2"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-ui writing-mode-vertical rotate-180">
          Active
        </span>
      </m.div>
      
      {/* Right: Reflective */}
      <m.div 
        className="absolute right-0 top-1/2 translate-x-6 -translate-y-1/2"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-ui writing-mode-vertical">
          Reflective
        </span>
      </m.div>
    </>
  )
})

const QuadrantLabels = memo(function QuadrantLabels({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.74, 0.78, 0.80, 0.82], [0, 0.4, 0.4, 0])
  
  const quadrants = [
    { label: 'Diverging', x: 25, y: 25, color: 'text-blue-400/40' },
    { label: 'Assimilating', x: 75, y: 25, color: 'text-purple-400/40' },
    { label: 'Converging', x: 75, y: 75, color: 'text-emerald-400/40' },
    { label: 'Accommodating', x: 25, y: 75, color: 'text-amber-400/40' },
  ]
  
  return (
    <>
      {quadrants.map((q) => (
        <m.div
          key={q.label}
          className="absolute"
          style={{
            left: `${q.x}%`,
            top: `${q.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          <span className={`text-[7px] uppercase tracking-[0.2em] font-ui ${q.color}`}>
            {q.label}
          </span>
        </m.div>
      ))}
    </>
  )
})

// ═══════════════════════════════════════════════════════════════════
// CONTENT (Headline + CTA)
// ═══════════════════════════════════════════════════════════════════

const Content = memo(function Content({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.65, 0.70, 0.80, 0.82], [0, 1, 1, 0])
  const y = useTransform(progress, [0.65, 0.70], [30, 0])
  
  return (
    <m.div
      className="text-center lg:text-left max-w-md"
      style={{ opacity, y }}
    >
      {/* Eyebrow */}
      <span className="block text-[10px] uppercase tracking-[0.5em] text-emerald-400/60 font-ui mb-4">
        Teams
      </span>
      
      {/* Headline */}
      <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">
        Collective
        <br />
        <span className="text-emerald-400">intelligence</span>
      </h2>
      
      {/* Fact */}
      <p className="text-sm text-white/40 font-ui mb-6">
        Turn diversity into strength
      </p>
      
      {/* CTA */}
      <Link 
        to="/auth"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-ui text-sm uppercase tracking-[0.15em] hover:bg-emerald-500/20 transition-colors group"
      >
        Explore Teams
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </Link>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// METRICS OVERLAY
// ═══════════════════════════════════════════════════════════════════

const MetricsOverlay = memo(function MetricsOverlay({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.76, 0.79, 0.80, 0.82], [0, 0.7, 0.7, 0])
  
  const metrics = [
    { label: 'Style Diversity', value: '87%' },
    { label: 'Collaboration', value: '4.2' },
    { label: 'Team Balance', value: 'High' },
  ]
  
  return (
    <m.div
      className="absolute bottom-[15%] right-[8%] hidden lg:block"
      style={{ opacity }}
    >
      <div className="text-[9px] font-mono text-white/30">
        <div className="text-white/50 mb-3">TEAM METRICS</div>
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center justify-between gap-6">
              <span>{metric.label}</span>
              <span className="text-emerald-400/60">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN TEAMS SCENE
// ═══════════════════════════════════════════════════════════════════

export const TeamsScene = memo(function TeamsScene({ 
  progress,
}: TeamsSceneProps) {
  // Scene visibility
  const sceneOpacity = useTransform(progress, [0.63, 0.65, 0.80, 0.82], [0, 1, 1, 0])
  
  return (
    <m.div 
      className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
      style={{ opacity: sceneOpacity }}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 60% 50%, rgba(16, 185, 129, 0.06) 0%, transparent 60%)
          `,
        }}
      />
      
      {/* Main content - two column layout */}
      <div className="w-full px-[8%] md:px-[12%]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          {/* Left: Content */}
          <Content progress={progress} />
          
          {/* Right: Scatter Visualization */}
          <ScatterVisualization progress={progress} />
        </div>
      </div>
      
      {/* Metrics Overlay */}
      <MetricsOverlay progress={progress} />
    </m.div>
  )
})

export default TeamsScene
