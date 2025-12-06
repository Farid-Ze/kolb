import { useRef, useEffect, useState, useCallback } from 'react'

interface ScrollTimelineState {
  /** Current scroll progress (0-1) */
  progress: number
  /** Scroll direction: 1 = down, -1 = up, 0 = idle */
  direction: number
  /** Scroll velocity (px per frame) */
  velocity: number
  /** Whether user is actively scrolling */
  isScrolling: boolean
}

interface UseScrollTimelineOptions {
  /** Element to track scroll on (defaults to window) */
  target?: React.RefObject<HTMLElement>
  /** Smoothing factor for progress (0-1, higher = smoother) */
  smoothing?: number
  /** Throttle scroll events (ms) */
  throttle?: number
  /** Callback on scroll */
  onScroll?: (state: ScrollTimelineState) => void
}

/**
 * Hook for scroll-driven animations and timelines.
 * 
 * Features:
 * - Smooth progress tracking (0-1)
 * - Direction detection
 * - Velocity calculation
 * - Configurable smoothing
 * 
 * @example
 * const { progress, direction, velocity } = useScrollTimeline({
 *   smoothing: 0.1,
 *   onScroll: (state) => console.log(state.progress)
 * })
 */
export function useScrollTimeline(options: UseScrollTimelineOptions = {}): ScrollTimelineState {
  const {
    target,
    smoothing = 0.1,
    throttle = 16, // ~60fps
    onScroll,
  } = options

  const [state, setState] = useState<ScrollTimelineState>({
    progress: 0,
    direction: 0,
    velocity: 0,
    isScrolling: false,
  })

  const lastScrollY = useRef(0)
  const lastTime = useRef(Date.now())
  const smoothProgress = useRef(0)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafId = useRef<number | null>(null)
  const lastThrottle = useRef(0)

  const updateState = useCallback(() => {
    const element = target?.current
    const scrollY = element ? element.scrollTop : window.scrollY
    const maxScroll = element 
      ? element.scrollHeight - element.clientHeight
      : document.documentElement.scrollHeight - window.innerHeight

    const now = Date.now()
    const deltaTime = now - lastTime.current
    const deltaScroll = scrollY - lastScrollY.current

    // Calculate raw progress
    const rawProgress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0

    // Apply smoothing with lerp
    smoothProgress.current += (rawProgress - smoothProgress.current) * smoothing

    // Calculate velocity (px/ms → px/frame at 60fps)
    const velocity = deltaTime > 0 ? (deltaScroll / deltaTime) * 16.67 : 0

    // Determine direction
    const direction = deltaScroll > 0 ? 1 : deltaScroll < 0 ? -1 : 0

    // Update refs
    lastScrollY.current = scrollY
    lastTime.current = now

    const newState: ScrollTimelineState = {
      progress: smoothProgress.current,
      direction,
      velocity: Math.round(velocity * 100) / 100,
      isScrolling: true,
    }

    setState(newState)
    onScroll?.(newState)

    // Reset isScrolling after idle
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    scrollTimeout.current = setTimeout(() => {
      setState(prev => ({ ...prev, isScrolling: false, direction: 0 }))
    }, 150)
  }, [target, smoothing, onScroll])

  const handleScroll = useCallback(() => {
    const now = Date.now()
    if (now - lastThrottle.current < throttle) {
      // Request next frame for smooth updates
      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(updateState)
      return
    }
    lastThrottle.current = now
    updateState()
  }, [updateState, throttle])

  useEffect(() => {
    const element = target?.current ?? window

    element.addEventListener('scroll', handleScroll, { passive: true })

    // Initial state
    handleScroll()

    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [target, handleScroll])

  return state
}

/**
 * Maps scroll progress to a specific range.
 * 
 * @example
 * const videoTime = mapScrollToRange(progress, 0, 0.5, 0, 10) // 0-10 seconds in first half
 */
export function mapScrollToRange(
  progress: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number
): number {
  if (progress <= inStart) return outStart
  if (progress >= inEnd) return outEnd
  
  const normalizedProgress = (progress - inStart) / (inEnd - inStart)
  return outStart + normalizedProgress * (outEnd - outStart)
}

/**
 * Creates segments from scroll progress.
 * Useful for triggering different animations at different scroll positions.
 * 
 * @example
 * const segments = createScrollSegments([0, 0.25, 0.5, 0.75, 1])
 * const { index, localProgress } = getActiveSegment(progress, segments)
 */
export function createScrollSegments(breakpoints: number[]) {
  return breakpoints.map((bp, i) => ({
    start: bp,
    end: breakpoints[i + 1] ?? 1,
  }))
}

export function getActiveSegment(progress: number, segments: ReturnType<typeof createScrollSegments>) {
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (progress >= segment.start && progress < segment.end) {
      const localProgress = (progress - segment.start) / (segment.end - segment.start)
      return { index: i, localProgress, segment }
    }
  }
  return { index: segments.length - 1, localProgress: 1, segment: segments[segments.length - 1] }
}

export default useScrollTimeline
