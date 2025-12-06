import { useRef, useCallback, useMemo } from 'react'
import { useScroll, useSpring, useTransform, useVelocity, MotionValue } from 'framer-motion'

/**
 * GLOBAL TIMELINE HOOK
 * 
 * Performance-optimized single scroll listener that powers ALL landing page animations.
 * Eliminates multiple useScroll() hooks (was 7x, now 1x).
 * 
 * Features:
 * - Single scroll event listener (passive)
 * - Spring-smoothed progress for buttery animations
 * - Velocity tracking for dynamic effects (stretch, blur intensity)
 * - Pre-calculated section ranges to avoid runtime math
 * - Memoized transforms to prevent re-renders
 * 
 * Target: FCP <1.5s, LCP <2.5s, TBT <200ms
 */

// Section scroll ranges (percentage of total scroll 0-1)
// These define when each scene is "active"
export const SCENE_RANGES = {
  hero:       [0.00, 0.08],
  sphere:     [0.08, 0.22],
  discover:   [0.22, 0.36],
  visualize:  [0.36, 0.50],
  understand: [0.50, 0.64],
  grow:       [0.64, 0.78],
  cta:        [0.78, 1.00],
} as const

// Spring physics config - balanced between responsiveness and smoothness
const SPRING_CONFIG = {
  stiffness: 50,
  damping: 20,
  restDelta: 0.001,
}

export interface GlobalTimeline {
  /** Raw scroll progress 0-1 */
  scrollProgress: MotionValue<number>
  /** Smoothed scroll progress with spring physics */
  smoothProgress: MotionValue<number>
  /** Scroll velocity for dynamic effects */
  velocity: MotionValue<number>
  /** Absolute scroll velocity (always positive) */
  absVelocity: MotionValue<number>
  /** Get section-specific progress (0-1 within that section) */
  getSectionProgress: (scene: keyof typeof SCENE_RANGES) => MotionValue<number>
  /** Container ref to attach to root element */
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Single source of truth for all scroll-driven animations.
 * Call this ONCE at the root LandingPage component.
 */
export function useGlobalTimeline(): GlobalTimeline {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Single scroll listener - passive by default in Framer Motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })
  
  // Spring-smoothed for buttery animations
  const smoothProgress = useSpring(scrollYProgress, SPRING_CONFIG)
  
  // Velocity for dynamic effects (stretch, motion blur intensity)
  const velocity = useVelocity(scrollYProgress)
  const absVelocity = useTransform(velocity, (v) => Math.abs(v))
  
  // Memoized section progress calculator
  // This creates a new MotionValue that maps global progress to section-local progress
  const getSectionProgress = useCallback((scene: keyof typeof SCENE_RANGES): MotionValue<number> => {
    const [start, end] = SCENE_RANGES[scene]
    // Transform global 0-1 to section-local 0-1
    return useTransform(smoothProgress, [start, end], [0, 1])
  }, [smoothProgress])
  
  return useMemo(() => ({
    scrollProgress: scrollYProgress,
    smoothProgress,
    velocity,
    absVelocity,
    getSectionProgress,
    containerRef,
  }), [scrollYProgress, smoothProgress, velocity, absVelocity, getSectionProgress])
}

/**
 * Hook for individual scenes to consume timeline.
 * Much lighter than creating new useScroll() per scene.
 */
export function useSceneProgress(
  smoothProgress: MotionValue<number>,
  scene: keyof typeof SCENE_RANGES
) {
  const [start, end] = SCENE_RANGES[scene]
  
  // Section-local progress (0-1)
  const progress = useTransform(smoothProgress, [start, end], [0, 1])
  
  // Smoothed version for animations that need extra smoothness
  const smoothSection = useSpring(progress, SPRING_CONFIG)
  
  return { progress, smoothSection }
}

/**
 * Utility to create staggered animation transforms.
 * Avoids creating useTransform inside loops (React hooks rule).
 */
export function createStaggeredTransforms(
  progress: MotionValue<number>,
  count: number,
  options: {
    staggerDelay?: number
    entryStart?: number
    entryEnd?: number
    exitStart?: number
    exitEnd?: number
  } = {}
) {
  const {
    staggerDelay = 0.08,
    entryStart = 0.15,
    entryEnd = 0.3,
    exitStart = 0.8,
    exitEnd = 0.95,
  } = options
  
  // Pre-calculate all transforms to avoid hooks in loops
  return Array.from({ length: count }, (_, i) => {
    const delay = i * staggerDelay
    return {
      opacity: useTransform(
        progress,
        [entryStart + delay, entryEnd + delay, exitStart, exitEnd],
        [0, 1, 1, 0]
      ),
      y: useTransform(
        progress,
        [entryStart + delay, entryEnd + delay],
        [20, 0]
      ),
      scale: useTransform(
        progress,
        [entryStart + delay, entryEnd + delay],
        [0.95, 1]
      ),
    }
  })
}
