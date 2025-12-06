/**
 * FUTURE SCENE (32% - 48%)
 * 
 * The assessment product. Kite visualization.
 * 
 * Citrix Layered Information:
 * - Eyebrow: "FUTURE"
 * - Headline: "MAP YOUR LEARNING DNA"
 * - Visual labels: Axis labels (FEELING / WATCHING / THINKING / DOING)
 * - Data overlay: 9 dimensions visualization
 * - Hotspot: "Take Assessment" CTA
 * - Fact: "12 randomized scenarios · 24 choices · 9 dimensions"
 * 
 * Animation:
 * - 32-36%: Scene enters, kite wireframe draws
 * - 36-42%: Axis labels appear, data points animate
 * - 42-48%: CTA pulses, transition to next
 */

import { memo } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface FutureSceneProps {
  progress: MotionValue<number>
  reduced?: boolean | null
}

// ═══════════════════════════════════════════════════════════════════
// KITE VISUALIZATION
// ═══════════════════════════════════════════════════════════════════

const KiteVisualization = memo(function KiteVisualization({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  // Drawing animation
  const drawProgress = useTransform(progress, [0.34, 0.40], [0, 1])
  const opacity = useTransform(progress, [0.33, 0.36, 0.46, 0.48], [0, 1, 1, 0])
  const rotation = useTransform(progress, [0.32, 0.48], [0, 15])
  
  return (
    <m.div 
      className="relative w-[min(60vw,400px)] h-[min(60vw,400px)]"
      style={{ opacity, rotate: rotation }}
    >
      {/* Grid lines (subtle) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
        {/* Concentric squares */}
        {[80, 120, 160].map((size) => (
          <m.rect
            key={size}
            x={200 - size}
            y={200 - size}
            width={size * 2}
            height={size * 2}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            transform="rotate(45 200 200)"
            style={{
              pathLength: drawProgress,
            }}
          />
        ))}
        
        {/* Axis lines */}
        <m.line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <m.line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        
        {/* Kite shape (diamond) */}
        <m.path
          d="M 200 40 L 360 200 L 200 360 L 40 200 Z"
          fill="none"
          stroke="url(#kiteGradient)"
          strokeWidth="2"
          style={{
            pathLength: drawProgress,
          }}
        />
        
        {/* Data points (example learning profile) */}
        <m.path
          d="M 200 80 L 300 200 L 200 280 L 120 200 Z"
          fill="rgba(99, 102, 241, 0.1)"
          stroke="rgba(99, 102, 241, 0.5)"
          strokeWidth="2"
          style={{
            pathLength: drawProgress,
            opacity: useTransform(progress, [0.38, 0.42], [0, 1]),
          }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="kiteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.8)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.8)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Axis Labels */}
      <AxisLabels progress={progress} />
    </m.div>
  )
})

const AxisLabels = memo(function AxisLabels({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const labelOpacity = useTransform(progress, [0.38, 0.42, 0.46, 0.48], [0, 1, 1, 0])
  
  return (
    <>
      {/* Top: EXPERIENCING */}
      <m.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-center"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-indigo-400 font-ui">
          Experiencing
        </span>
      </m.div>
      
      {/* Right: REFLECTING */}
      <m.div 
        className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-cyan-400 font-ui writing-mode-vertical">
          Reflecting
        </span>
      </m.div>
      
      {/* Bottom: THINKING */}
      <m.div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-center"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-amber-500 font-ui">
          Thinking
        </span>
      </m.div>
      
      {/* Left: ACTING */}
      <m.div 
        className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2"
        style={{ opacity: labelOpacity }}
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-amber-400 font-ui writing-mode-vertical rotate-180">
          Acting
        </span>
      </m.div>
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
  const opacity = useTransform(progress, [0.32, 0.36, 0.46, 0.48], [0, 1, 1, 0])
  const y = useTransform(progress, [0.32, 0.36], [30, 0])
  
  return (
    <m.div
      className="text-center lg:text-left max-w-md"
      style={{ opacity, y }}
    >
      {/* Eyebrow */}
      <span className="block text-[10px] uppercase tracking-[0.5em] text-indigo-400/60 font-ui mb-4">
        Future
      </span>
      
      {/* Headline */}
      <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">
        Map your
        <br />
        <span className="text-indigo-400">learning DNA</span>
      </h2>
      
      {/* Fact */}
      <p className="text-sm text-white/40 font-ui mb-6">
        12 randomized scenarios · 24 choices · 9 dimensions
      </p>
      
      {/* CTA */}
      <Link 
        to="/auth"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-ui text-sm uppercase tracking-[0.15em] hover:bg-indigo-500/20 transition-colors group"
      >
        Take Assessment
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </Link>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// DATA OVERLAY (Dimensions)
// ═══════════════════════════════════════════════════════════════════

const DIMENSIONS = [
  'Concrete Experience',
  'Reflective Observation', 
  'Abstract Conceptualization',
  'Active Experimentation',
  'Feeling', 'Watching', 'Thinking', 'Doing',
  'Diverging', 'Assimilating', 'Converging', 'Accommodating',
]

const DataOverlay = memo(function DataOverlay({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.40, 0.44, 0.46, 0.48], [0, 0.6, 0.6, 0])
  
  return (
    <m.div
      className="absolute bottom-[15%] right-[10%] hidden lg:block"
      style={{ opacity }}
    >
      <div className="text-[9px] font-mono text-white/30 space-y-1">
        <div className="text-white/50 mb-2">DIMENSIONS</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {DIMENSIONS.slice(0, 4).map((dim) => (
            <div key={dim} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-indigo-400/50" />
              <span>{dim}</span>
            </div>
          ))}
        </div>
      </div>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN FUTURE SCENE
// ═══════════════════════════════════════════════════════════════════

export const FutureScene = memo(function FutureScene({ 
  progress,
}: FutureSceneProps) {
  // Scene visibility
  const sceneOpacity = useTransform(progress, [0.30, 0.32, 0.46, 0.48], [0, 1, 1, 0])
  
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
            radial-gradient(ellipse 50% 40% at 60% 50%, rgba(99, 102, 241, 0.06) 0%, transparent 60%)
          `,
        }}
      />
      
      {/* Main content - two column layout */}
      <div className="w-full px-[8%] md:px-[12%]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          {/* Left: Content */}
          <Content progress={progress} />
          
          {/* Right: Kite Visualization */}
          <KiteVisualization progress={progress} />
        </div>
      </div>
      
      {/* Data Overlay */}
      <DataOverlay progress={progress} />
    </m.div>
  )
})

export default FutureScene
