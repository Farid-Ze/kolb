/**
 * SCENE NAVIGATION
 * 
 * Citrix-style navigation overlay:
 * - Scene counter (01 / 06)
 * - Progress indicator
 * - Prev/Next controls
 * - Current scene label
 * 
 * Fixed position, always visible during scroll experience
 */

import { memo, useMemo } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// SCENE DATA
// ═══════════════════════════════════════════════════════════════════

export const SCENES = [
  { id: 'spectacle', label: 'ZENOTIKA', start: 0, end: 0.18 },
  { id: 'platform', label: 'PLATFORM', start: 0.18, end: 0.32 },
  { id: 'future', label: 'FUTURE', start: 0.32, end: 0.48 },
  { id: 'sphere', label: 'SPHERE', start: 0.48, end: 0.65 },
  { id: 'teams', label: 'TEAMS', start: 0.65, end: 0.82 },
  { id: 'begin', label: 'BEGIN', start: 0.82, end: 1 },
] as const

export type SceneId = typeof SCENES[number]['id']

// ═══════════════════════════════════════════════════════════════════
// HOOK: Get current scene from progress
// ═══════════════════════════════════════════════════════════════════

export function useCurrentScene(progress: number): typeof SCENES[number] {
  return useMemo(() => {
    for (let i = SCENES.length - 1; i >= 0; i--) {
      if (progress >= SCENES[i].start) {
        return SCENES[i]
      }
    }
    return SCENES[0]
  }, [progress])
}

export function getCurrentSceneIndex(progress: number): number {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (progress >= SCENES[i].start) {
      return i
    }
  }
  return 0
}

// ═══════════════════════════════════════════════════════════════════
// SCENE NAV COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface SceneNavProps {
  progress: MotionValue<number>
  onNavigate?: (sceneIndex: number) => void
}

export const SceneNav = memo(function SceneNav({ 
  progress,
  onNavigate, 
}: SceneNavProps) {
  // Fade in after initial load, fade out at end
  const opacity = useTransform(progress, [0, 0.05, 0.9, 0.98], [0, 1, 1, 0])
  
  return (
    <m.nav 
      className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-6"
      style={{ opacity }}
    >
      {/* Scene Counter */}
      <SceneCounter progress={progress} />
      
      {/* Progress Dots */}
      <ProgressDots progress={progress} onNavigate={onNavigate} />
      
      {/* Navigation Controls */}
      <NavControls progress={progress} onNavigate={onNavigate} />
    </m.nav>
  )
})

// ═══════════════════════════════════════════════════════════════════
// SCENE COUNTER (01 / 06)
// ═══════════════════════════════════════════════════════════════════

const SceneCounter = memo(function SceneCounter({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  // Calculate current scene index based on progress thresholds
  const sceneIndex = useTransform(progress, (p) => getCurrentSceneIndex(p))
  const currentLabel = useTransform(sceneIndex, (idx) => SCENES[idx].label as string)
  const currentNumber = useTransform(sceneIndex, (idx) => String(idx + 1).padStart(2, '0'))
  
  return (
    <div className="text-right">
      {/* Scene Label */}
      <m.div className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-ui mb-1">
        {currentLabel}
      </m.div>
      
      {/* Counter */}
      <div className="flex items-baseline gap-1 font-mono text-white/70">
        <m.span className="text-2xl font-light">
          {currentNumber}
        </m.span>
        <span className="text-xs text-white/30">/</span>
        <span className="text-xs text-white/30">{String(SCENES.length).padStart(2, '0')}</span>
      </div>
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// PROGRESS DOTS
// ═══════════════════════════════════════════════════════════════════

const ProgressDots = memo(function ProgressDots({ 
  progress,
  onNavigate,
}: { 
  progress: MotionValue<number>
  onNavigate?: (sceneIndex: number) => void
}) {
  const currentIndex = useTransform(progress, (p) => getCurrentSceneIndex(p))
  
  return (
    <div className="flex flex-col gap-2">
      {SCENES.map((scene, i) => (
        <ProgressDot 
          key={scene.id}
          index={i}
          scene={scene}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
})

const ProgressDot = memo(function ProgressDot({
  index,
  scene,
  currentIndex,
  onNavigate,
}: {
  index: number
  scene: typeof SCENES[number]
  currentIndex: MotionValue<number>
  onNavigate?: (sceneIndex: number) => void
}) {
  const isActive = useTransform(currentIndex, (curr) => curr === index)
  
  const scale = useTransform(isActive, (active) => active ? 1.5 : 1)
  const bgOpacity = useTransform(isActive, (active) => active ? 1 : 0.3)
  
  const handleClick = () => {
    onNavigate?.(index)
  }
  
  return (
    <m.button
      onClick={handleClick}
      className="w-2 h-2 rounded-full bg-white cursor-pointer transition-colors hover:bg-blue-400"
      style={{ 
        scale,
        opacity: bgOpacity,
      }}
      whileHover={{ scale: 1.8 }}
      whileTap={{ scale: 1.2 }}
      aria-label={`Go to ${scene.label}`}
    />
  )
})

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION CONTROLS (PREV / NEXT)
// ═══════════════════════════════════════════════════════════════════

const NavControls = memo(function NavControls({ 
  progress,
  onNavigate,
}: { 
  progress: MotionValue<number>
  onNavigate?: (sceneIndex: number) => void
}) {
  const currentIndex = useTransform(progress, (p) => getCurrentSceneIndex(p))
  
  const handlePrev = () => {
    const curr = getCurrentSceneIndex(progress.get())
    if (curr > 0) {
      onNavigate?.(curr - 1)
    }
  }
  
  const handleNext = () => {
    const curr = getCurrentSceneIndex(progress.get())
    if (curr < SCENES.length - 1) {
      onNavigate?.(curr + 1)
    }
  }
  
  // Hide prev at start, hide next at end
  const prevOpacity = useTransform(currentIndex, (idx) => idx > 0 ? 1 : 0.2)
  const nextOpacity = useTransform(currentIndex, (idx) => idx < SCENES.length - 1 ? 1 : 0.2)
  
  return (
    <div className="flex gap-3">
      <m.button
        onClick={handlePrev}
        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
        style={{ opacity: prevOpacity }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Previous scene"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </m.button>
      
      <m.button
        onClick={handleNext}
        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
        style={{ opacity: nextOpacity }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Next scene"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </m.button>
    </div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// SCROLL CUE (Bottom of screen)
// ═══════════════════════════════════════════════════════════════════

interface ScrollCueProps {
  progress: MotionValue<number>
}

export const ScrollCue = memo(function ScrollCue({ progress }: ScrollCueProps) {
  // Only visible at very start
  const opacity = useTransform(progress, [0, 0.02, 0.05], [0, 1, 0])
  const y = useTransform(progress, [0, 0.05], [0, 20])
  
  return (
    <m.div 
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2"
      style={{ opacity, y }}
    >
      <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-ui">
        Scroll to explore
      </span>
      <m.div
        className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-1"
        initial={{ opacity: 0.5 }}
      >
        <m.div
          className="w-1 h-2 rounded-full bg-white/60"
          animate={{ 
            y: [0, 12, 0],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
      </m.div>
    </m.div>
  )
})

export default SceneNav
