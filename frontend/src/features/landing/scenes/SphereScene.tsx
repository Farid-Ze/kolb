/**
 * SPHERE SCENE (48% - 65%)
 * 
 * The Milestone Gallery. Capture growth moments.
 * 
 * Citrix Layered Information:
 * - Eyebrow: "SPHERE"
 * - Headline: "YOUR GROWTH, VISUALIZED"
 * - Visual labels: Constellation nodes representing milestones
 * - Data overlay: Timeline of growth moments
 * - Hotspot: "Add Milestone" interactive node
 * - Fact: "Capture moments that shape you"
 * 
 * Animation:
 * - 48-52%: Scene enters, constellation draws
 * - 52-60%: Nodes light up in sequence
 * - 60-65%: Timeline reveals, transition to next
 */

import { memo } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SphereSceneProps {
  progress: MotionValue<number>
  reduced?: boolean | null
}

// ═══════════════════════════════════════════════════════════════════
// CONSTELLATION DATA (Milestones)
// ═══════════════════════════════════════════════════════════════════

const MILESTONES = [
  { id: 'first', label: 'First Insight', x: 30, y: 25, size: 'lg' },
  { id: 'growth', label: 'Growth Moment', x: 55, y: 15, size: 'md' },
  { id: 'challenge', label: 'Challenge Overcome', x: 75, y: 35, size: 'lg' },
  { id: 'connection', label: 'New Connection', x: 20, y: 55, size: 'sm' },
  { id: 'breakthrough', label: 'Breakthrough', x: 50, y: 50, size: 'xl', highlight: true },
  { id: 'reflection', label: 'Deep Reflection', x: 70, y: 65, size: 'md' },
  { id: 'mastery', label: 'Skill Mastery', x: 35, y: 75, size: 'lg' },
  { id: 'next', label: 'Next Chapter', x: 65, y: 80, size: 'sm' },
]

const CONNECTIONS = [
  ['first', 'growth'],
  ['growth', 'challenge'],
  ['first', 'connection'],
  ['connection', 'breakthrough'],
  ['breakthrough', 'challenge'],
  ['breakthrough', 'reflection'],
  ['reflection', 'mastery'],
  ['mastery', 'next'],
  ['breakthrough', 'next'],
]

// ═══════════════════════════════════════════════════════════════════
// CONSTELLATION VISUALIZATION
// ═══════════════════════════════════════════════════════════════════

const ConstellationVisualization = memo(function ConstellationVisualization({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.48, 0.52, 0.63, 0.65], [0, 1, 1, 0])
  
  // Get milestone positions for connections
  const getMilestonePos = (id: string) => {
    const m = MILESTONES.find(m => m.id === id)
    return m ? { x: m.x, y: m.y } : { x: 50, y: 50 }
  }
  
  return (
    <m.div 
      className="relative w-[min(70vw,500px)] h-[min(60vw,400px)]"
      style={{ opacity }}
    >
      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {CONNECTIONS.map(([from, to], i) => {
          const start = getMilestonePos(from)
          const end = getMilestonePos(to)
          return (
            <ConnectionLine 
              key={`${from}-${to}`}
              start={start}
              end={end}
              index={i}
              progress={progress}
            />
          )
        })}
      </svg>
      
      {/* Milestone nodes */}
      {MILESTONES.map((milestone, i) => (
        <MilestoneNode 
          key={milestone.id}
          milestone={milestone}
          index={i}
          progress={progress}
        />
      ))}
    </m.div>
  )
})

const ConnectionLine = memo(function ConnectionLine({
  start,
  end,
  index,
  progress,
}: {
  start: { x: number; y: number }
  end: { x: number; y: number }
  index: number
  progress: MotionValue<number>
}) {
  const delay = index * 0.005
  const opacity = useTransform(
    progress, 
    [0.50 + delay, 0.54 + delay, 0.63, 0.65], 
    [0, 0.3, 0.3, 0]
  )
  
  return (
    <m.line
      x1={start.x}
      y1={start.y}
      x2={end.x}
      y2={end.y}
      stroke="rgba(139, 92, 246, 0.5)"
      strokeWidth="0.3"
      style={{ opacity }}
    />
  )
})

const MilestoneNode = memo(function MilestoneNode({
  milestone,
  index,
  progress,
}: {
  milestone: typeof MILESTONES[number]
  index: number
  progress: MotionValue<number>
}) {
  const delay = index * 0.008
  const opacity = useTransform(
    progress, 
    [0.51 + delay, 0.55 + delay, 0.63, 0.65], 
    [0, 1, 1, 0]
  )
  const scale = useTransform(progress, [0.51 + delay, 0.55 + delay], [0, 1])
  
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-6 h-6',
  }
  
  const isHighlight = 'highlight' in milestone && milestone.highlight
  
  return (
    <m.div
      className="absolute flex flex-col items-center"
      style={{
        left: `${milestone.x}%`,
        top: `${milestone.y}%`,
        transform: 'translate(-50%, -50%)',
        opacity,
        scale,
      }}
    >
      {/* Node */}
      <div 
        className={`
          ${sizeMap[milestone.size as keyof typeof sizeMap]} 
          rounded-full 
          ${isHighlight 
            ? 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/50' 
            : 'bg-white/20 border border-white/30'
          }
        `}
      />
      
      {/* Label (only for highlight and lg) */}
      {(isHighlight || milestone.size === 'lg') && (
        <span className={`
          mt-2 text-[8px] uppercase tracking-[0.2em] font-ui whitespace-nowrap
          ${isHighlight ? 'text-purple-300' : 'text-white/40'}
        `}>
          {milestone.label}
        </span>
      )}
    </m.div>
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
  const opacity = useTransform(progress, [0.48, 0.52, 0.63, 0.65], [0, 1, 1, 0])
  const y = useTransform(progress, [0.48, 0.52], [30, 0])
  
  return (
    <m.div
      className="text-center lg:text-left max-w-md"
      style={{ opacity, y }}
    >
      {/* Eyebrow */}
      <span className="block text-[10px] uppercase tracking-[0.5em] text-purple-400/60 font-ui mb-4">
        Sphere
      </span>
      
      {/* Headline */}
      <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">
        Your growth,
        <br />
        <span className="text-purple-400">visualized</span>
      </h2>
      
      {/* Fact */}
      <p className="text-sm text-white/40 font-ui mb-6">
        Capture moments that shape you
      </p>
      
      {/* CTA */}
      <Link 
        to="/auth"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-ui text-sm uppercase tracking-[0.15em] hover:bg-purple-500/20 transition-colors group"
      >
        Start Your Gallery
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </Link>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// TIMELINE OVERLAY
// ═══════════════════════════════════════════════════════════════════

const TimelineOverlay = memo(function TimelineOverlay({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.58, 0.62, 0.63, 0.65], [0, 0.7, 0.7, 0])
  
  const timelineEvents = [
    { date: 'Week 1', label: 'Initial Assessment' },
    { date: 'Week 4', label: 'First Breakthrough' },
    { date: 'Week 8', label: 'Pattern Recognition' },
    { date: 'Now', label: 'Continuous Growth' },
  ]
  
  return (
    <m.div
      className="absolute bottom-[15%] left-[8%] hidden lg:block"
      style={{ opacity }}
    >
      <div className="text-[9px] font-mono text-white/30">
        <div className="text-white/50 mb-3">GROWTH TIMELINE</div>
        <div className="flex items-end gap-6">
          {timelineEvents.map((event, i) => (
            <div key={event.date} className="flex flex-col items-center">
              <div className={`w-0.5 bg-purple-400/30 mb-1`} style={{ height: `${20 + i * 8}px` }} />
              <span className="text-purple-400/60">{event.date}</span>
            </div>
          ))}
        </div>
      </div>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN SPHERE SCENE
// ═══════════════════════════════════════════════════════════════════

export const SphereScene = memo(function SphereScene({ 
  progress,
}: SphereSceneProps) {
  // Scene visibility
  const sceneOpacity = useTransform(progress, [0.46, 0.48, 0.63, 0.65], [0, 1, 1, 0])
  
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
            radial-gradient(ellipse 50% 40% at 40% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)
          `,
        }}
      />
      
      {/* Main content - two column layout */}
      <div className="w-full px-[8%] md:px-[12%]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          {/* Left: Content */}
          <Content progress={progress} />
          
          {/* Right: Constellation */}
          <ConstellationVisualization progress={progress} />
        </div>
      </div>
      
      {/* Timeline Overlay */}
      <TimelineOverlay progress={progress} />
    </m.div>
  )
})

export default SphereScene
