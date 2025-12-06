/**
 * SCENE TRANSITIONS
 * 
 * Matte/masking geometric wipes - NOT fades.
 * Implements the scene transition technique from Citrix Red Bull Racing
 * where bodywork/geometric shapes wipe across the screen.
 * 
 * Techniques:
 * - Geometric shape masks (diagonal, horizontal, radial)
 * - Direction-aware based on scroll velocity
 * - Clip-path animations synced to scroll
 * - Foreground obstruction simulation
 */

import { memo, useRef, useMemo } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type TransitionType = 
  | 'wipe-left'      // Wipe from right to left
  | 'wipe-right'     // Wipe from left to right
  | 'wipe-up'        // Wipe from bottom to top
  | 'wipe-down'      // Wipe from top to bottom
  | 'diagonal-tl'    // Diagonal from bottom-right to top-left
  | 'diagonal-br'    // Diagonal from top-left to bottom-right
  | 'radial-in'      // Radial from edges to center
  | 'radial-out'     // Radial from center to edges
  | 'split-h'        // Split horizontal (from center)
  | 'split-v'        // Split vertical (from center)
  | 'blinds'         // Venetian blinds effect

interface TransitionConfig {
  /** Transition type */
  type: TransitionType
  /** Progress range [start, end] where transition occurs */
  range: [number, number]
  /** Color of the matte/mask */
  color?: string
  /** Easing function */
  ease?: string
  /** Z-index */
  zIndex?: number
}

// ═══════════════════════════════════════════════════════════════════
// CLIP PATH GENERATORS
// ═══════════════════════════════════════════════════════════════════

const generateClipPath = (type: TransitionType, progress: number): string => {
  // Progress is 0 (not started) to 1 (fully revealed/hidden)
  const p = Math.max(0, Math.min(1, progress))
  
  switch (type) {
    case 'wipe-left':
      // Mask moves from right to left, revealing content
      return `inset(0 ${(1 - p) * 100}% 0 0)`
    
    case 'wipe-right':
      // Mask moves from left to right
      return `inset(0 0 0 ${(1 - p) * 100}%)`
    
    case 'wipe-up':
      // Mask moves from bottom to top
      return `inset(0 0 ${(1 - p) * 100}% 0)`
    
    case 'wipe-down':
      // Mask moves from top to bottom
      return `inset(${(1 - p) * 100}% 0 0 0)`
    
    case 'diagonal-tl':
      // Diagonal wipe to top-left
      {
        const d1 = p * 200
        return `polygon(0 0, ${d1}% 0, 0 ${d1}%)`
      }
    
    case 'diagonal-br':
      // Diagonal wipe to bottom-right
      {
        const d2 = (1 - p) * 100
        return `polygon(${d2}% 100%, 100% ${d2}%, 100% 100%)`
      }
    
    case 'radial-in':
      // Circular reveal from edges
      {
        const r1 = (1 - p) * 150 // Start beyond viewport
        return `circle(${r1}% at 50% 50%)`
      }
    
    case 'radial-out':
      // Circular reveal from center
      {
        const r2 = p * 150
        return `circle(${r2}% at 50% 50%)`
      }
    
    case 'split-h':
      // Split from center horizontally
      {
        const h = (1 - p) * 50
        return `inset(0 ${h}% 0 ${h}%)`
      }
    
    case 'split-v':
      // Split from center vertically
      {
        const v = (1 - p) * 50
        return `inset(${v}% 0 ${v}% 0)`
      }
    
    case 'blinds':
      // Venetian blinds (5 bars)
      {
        const bars = 5
        const barHeight = 100 / bars
        const barProgress = p * barHeight
        return Array.from({ length: bars }, (_, i) => {
          const y = i * barHeight
          return `rect(${y}%, 0, ${y + barProgress}%, 100%)`
        }).join(', ')
      }
    
    default:
      return 'inset(0)'
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCENE WIPE COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface SceneWipeProps {
  /** Scroll progress (0-1) */
  progress: MotionValue<number>
  /** Transition configuration */
  config: TransitionConfig
  /** Children to be revealed */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

export const SceneWipe = memo(function SceneWipe({
  progress,
  config,
  children,
  className = '',
}: SceneWipeProps) {
  const { type, range, color = 'transparent', zIndex = 1 } = config
  const [rangeStart, rangeEnd] = range
  
  // Calculate local progress within range
  const localProgress = useTransform(
    progress,
    [rangeStart, rangeEnd],
    [0, 1]
  )
  
  // Generate clip path based on progress
  const clipPath = useTransform(localProgress, (p) => generateClipPath(type, p))
  
  return (
    <m.div
      className={`absolute inset-0 ${className}`}
      style={{
        clipPath,
        zIndex,
        backgroundColor: color,
      }}
    >
      {children}
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MATTE OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface MatteOverlayProps {
  /** Scroll progress (0-1) */
  progress: MotionValue<number>
  /** When the matte starts (0-1) */
  start: number
  /** When the matte ends (0-1) */
  end: number
  /** Direction of matte movement */
  direction?: 'left' | 'right' | 'up' | 'down'
  /** Matte color */
  color?: string
  /** Skew angle for dynamic feel */
  skew?: number
  /** Z-index */
  zIndex?: number
}

export const MatteOverlay = memo(function MatteOverlay({
  progress,
  start,
  end,
  direction = 'right',
  color = '#111111',
  skew = 5,
  zIndex = 100,
}: MatteOverlayProps) {
  // Transform progress to matte position
  // Matte enters at 'start', fully covers at midpoint, exits at 'end'
  const midpoint = start + (end - start) / 2
  
  const translateValue = useTransform(progress, (p) => {
    if (p < start) return -110 // Off screen before
    if (p > end) return 110    // Off screen after
    if (p < midpoint) {
      // Entering
      return -110 + ((p - start) / (midpoint - start)) * 110
    } else {
      // Exiting
      return ((p - midpoint) / (end - midpoint)) * 110
    }
  })
  
  const translateX = useTransform(translateValue, (v) => {
    if (direction === 'left') return `${-v}%`
    if (direction === 'right') return `${v}%`
    return '0%'
  })

  const translateY = useTransform(translateValue, (v) => {
    if (direction === 'up') return `${-v}%`
    if (direction === 'down') return `${v}%`
    return '0%'
  })
  
  return (
    <m.div
      className="fixed inset-0 pointer-events-none"
      style={{
        x: translateX,
        y: translateY,
        backgroundColor: color,
        zIndex,
        transform: `skewX(${direction === 'left' || direction === 'right' ? skew : 0}deg) skewY(${direction === 'up' || direction === 'down' ? skew : 0}deg)`,
      }}
    />
  )
})

// ═══════════════════════════════════════════════════════════════════
// FOREGROUND OBSTRUCTION COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface ForegroundObstructionProps {
  /** Scroll progress (0-1) */
  progress: MotionValue<number>
  /** When obstruction appears */
  triggerAt: number
  /** Duration in progress units */
  duration?: number
  /** Shape type */
  shape?: 'angular' | 'curved' | 'random'
  /** Color */
  color?: string
  /** Z-index */
  zIndex?: number
}

export const ForegroundObstruction = memo(function ForegroundObstruction({
  progress,
  triggerAt,
  duration = 0.05,
  shape = 'angular',
  color = '#0a0a0a',
  zIndex = 50,
}: ForegroundObstructionProps) {
  // Generate a complex polygon path that simulates an object passing close to camera
  const polygonPath = useMemo(() => {
    switch (shape) {
      case 'angular':
        return 'polygon(0% 40%, 30% 20%, 60% 35%, 100% 25%, 100% 75%, 70% 85%, 40% 70%, 0% 80%)'
      case 'curved':
        return 'ellipse(80% 60% at 50% 50%)'
      default:
        // Random-ish organic shape
        return 'polygon(5% 30%, 25% 10%, 55% 25%, 80% 5%, 95% 35%, 85% 65%, 60% 85%, 30% 70%, 10% 80%)'
    }
  }, [shape])
  
  // Calculate opacity and position based on progress
  const opacity = useTransform(progress, (p) => {
    if (p < triggerAt || p > triggerAt + duration) return 0
    const localP = (p - triggerAt) / duration
    // Fade in quickly, hold, fade out quickly
    if (localP < 0.2) return localP * 5
    if (localP > 0.8) return (1 - localP) * 5
    return 1
  })
  
  const x = useTransform(progress, (p) => {
    if (p < triggerAt) return '-100%'
    if (p > triggerAt + duration) return '100%'
    const localP = (p - triggerAt) / duration
    return `${(localP - 0.5) * 200}%`
  })
  
  const scale = useTransform(progress, (p) => {
    if (p < triggerAt || p > triggerAt + duration) return 1
    const localP = (p - triggerAt) / duration
    // Scale up as it passes (closer to camera)
    const peakAt = 0.5
    const distance = Math.abs(localP - peakAt)
    return 1 + (1 - distance * 2) * 0.5
  })
  
  return (
    <m.div
      className="fixed inset-0 pointer-events-none"
      style={{
        x,
        opacity,
        scale,
        clipPath: polygonPath,
        backgroundColor: color,
        zIndex,
        filter: 'blur(2px)',
      }}
    />
  )
})

// ═══════════════════════════════════════════════════════════════════
// SCENE CONTAINER WITH TRANSITIONS
// ═══════════════════════════════════════════════════════════════════

interface SceneContainerProps {
  /** Scroll progress */
  progress: MotionValue<number>
  /** Scene ID */
  id: string
  /** Enter transition config */
  enterTransition?: TransitionConfig
  /** Exit transition config */
  exitTransition?: TransitionConfig
  /** Children */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

export const SceneContainer = memo(function SceneContainer({
  progress,
  id,
  enterTransition,
  exitTransition,
  children,
  className = '',
}: SceneContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Calculate combined clip path from both transitions
  const clipPath = useTransform(progress, (p) => {
    let path = 'inset(0)'
    
    if (enterTransition) {
      const [start, end] = enterTransition.range
      if (p >= start && p <= end) {
        const localP = (p - start) / (end - start)
        path = generateClipPath(enterTransition.type, localP)
      } else if (p < start) {
        path = generateClipPath(enterTransition.type, 0)
      }
    }
    
    if (exitTransition && p >= exitTransition.range[0]) {
      const [start, end] = exitTransition.range
      if (p <= end) {
        const localP = (p - start) / (end - start)
        // Invert for exit
        path = generateClipPath(exitTransition.type, 1 - localP)
      } else {
        path = generateClipPath(exitTransition.type, 0)
      }
    }
    
    return path
  })
  
  return (
    <m.div
      ref={containerRef}
      id={id}
      className={`relative ${className}`}
      style={{ clipPath }}
    >
      {children}
    </m.div>
  )
})

export default SceneWipe
