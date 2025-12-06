/**
 * BEGIN SCENE (82% - 100%)
 * 
 * Triple-path CTA. Choose your journey.
 * 
 * Citrix Layered Information:
 * - Eyebrow: "BEGIN"
 * - Headline: "CHOOSE YOUR PATH"
 * - Visual: Three large CTA buttons (Future, Sphere, Teams)
 * - Data overlay: Quick stats per path
 * - Fact: Footer with branding
 * 
 * Animation:
 * - 82-88%: Scene enters, buttons stagger in
 * - 88-95%: Hover states activate
 * - 95-100%: Footer reveals
 */

import { memo } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface BeginSceneProps {
  progress: MotionValue<number>
  reduced?: boolean | null
}

// ═══════════════════════════════════════════════════════════════════
// PATH DATA
// ═══════════════════════════════════════════════════════════════════

const PATHS = [
  { 
    id: 'future', 
    label: 'FUTURE', 
    description: 'Discover your learning DNA',
    stat: '12 items · 9 dimensions',
    to: '/auth?mode=register&flow=future',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-400 hover:bg-blue-500/10',
  },
  { 
    id: 'sphere', 
    label: 'SPHERE', 
    description: 'Build your milestone gallery',
    stat: 'Capture · Reflect · Grow',
    to: '/auth?mode=register&flow=sphere',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    border: 'border-purple-500/30',
    hover: 'hover:border-purple-400 hover:bg-purple-500/10',
  },
  { 
    id: 'teams', 
    label: 'TEAMS', 
    description: 'Unlock collective intelligence',
    stat: 'Analyze · Optimize · Collaborate',
    to: '/auth?mode=register&flow=teams',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    border: 'border-emerald-500/30',
    hover: 'hover:border-emerald-400 hover:bg-emerald-500/10',
  },
]

// ═══════════════════════════════════════════════════════════════════
// PATH BUTTON
// ═══════════════════════════════════════════════════════════════════

const PathButton = memo(function PathButton({
  path,
  index,
  progress,
}: {
  path: typeof PATHS[number]
  index: number
  progress: MotionValue<number>
}) {
  const delay = index * 0.02
  const opacity = useTransform(
    progress, 
    [0.84 + delay, 0.88 + delay, 0.98, 1], 
    [0, 1, 1, 0.8]
  )
  const y = useTransform(progress, [0.84 + delay, 0.88 + delay], [40, 0])
  const scale = useTransform(progress, [0.84 + delay, 0.88 + delay], [0.9, 1])
  
  return (
    <m.div
      style={{ opacity, y, scale }}
      className="gpu-layer"
    >
      <Link 
        to={path.to}
        className={`
          group relative block p-8 lg:p-10 rounded-2xl border 
          ${path.border} ${path.hover}
          bg-white/[0.02] backdrop-blur-sm
          transition-all duration-300
        `}
      >
        {/* Label */}
        <div className={`
          font-headline text-3xl lg:text-4xl text-white mb-3 
          tracking-tight
        `}>
          {path.label}
        </div>
        
        {/* Description */}
        <p className="text-white/50 font-ui text-sm lg:text-base mb-4">
          {path.description}
        </p>
        
        {/* Stat */}
        <div className={`
          text-[10px] uppercase tracking-[0.3em] font-ui
          text-${path.color}-400/60
        `}>
          {path.stat}
        </div>
        
        {/* Arrow indicator */}
        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className={`text-${path.color}-400 text-xl`}>→</span>
        </div>
        
        {/* Gradient hover effect */}
        <div className={`
          absolute inset-0 rounded-2xl 
          bg-gradient-to-br ${path.gradient}
          opacity-0 group-hover:opacity-5 
          transition-opacity pointer-events-none
        `} />
      </Link>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// HEADER CONTENT
// ═══════════════════════════════════════════════════════════════════

const HeaderContent = memo(function HeaderContent({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.82, 0.86, 0.98, 1], [0, 1, 1, 0.8])
  const y = useTransform(progress, [0.82, 0.86], [30, 0])
  
  return (
    <m.div
      className="text-center mb-12 lg:mb-16"
      style={{ opacity, y }}
    >
      {/* Eyebrow */}
      <span className="block text-[10px] uppercase tracking-[0.5em] text-white/40 font-ui mb-4">
        Begin
      </span>
      
      {/* Headline */}
      <h2 className="font-headline text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
        Choose your{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
          path
        </span>
      </h2>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════

const Footer = memo(function Footer({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.92, 0.96], [0, 1])
  
  return (
    <m.footer
      className="absolute bottom-8 left-0 right-0 text-center"
      style={{ opacity }}
    >
      <div className="flex items-center justify-center gap-6 text-white/20 font-ui text-[10px] uppercase tracking-[0.3em]">
        <span>UNIKOM</span>
        <span className="text-white/10">·</span>
        <span>© 2024 Zenotika</span>
        <span className="text-white/10">·</span>
        <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
        <span className="text-white/10">·</span>
        <a href="#" className="hover:text-white/40 transition-colors">Terms</a>
      </div>
      
      {/* Powered by Kolb badge */}
      <div className="mt-4 text-white/10 font-ui text-[8px] uppercase tracking-[0.4em]">
        Powered by Kolb Learning Style Inventory 4.0
      </div>
    </m.footer>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN BEGIN SCENE
// ═══════════════════════════════════════════════════════════════════

export const BeginScene = memo(function BeginScene({ 
  progress,
}: BeginSceneProps) {
  // Scene visibility (stays visible at end)
  const sceneOpacity = useTransform(progress, [0.80, 0.82], [0, 1])
  
  return (
    <m.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden"
      style={{ opacity: sceneOpacity }}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 80% at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 30% 70%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 70% 30%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Main content */}
      <div className="w-full px-[8%] md:px-[12%] relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <HeaderContent progress={progress} />
          
          {/* Path buttons */}
          <div className="grid md:grid-cols-3 gap-6">
            {PATHS.map((path, i) => (
              <PathButton
                key={path.id}
                path={path}
                index={i}
                progress={progress}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer progress={progress} />
    </m.div>
  )
})

export default BeginScene
