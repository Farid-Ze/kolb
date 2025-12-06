import { useEffect, useState, useRef, useCallback } from 'react'
import type { RefObject } from 'react'

/**
 * INTERSECTION OBSERVER HOOK
 * 
 * Lazy render scenes below the fold - components only mount when visible.
 * Significantly improves initial page load performance.
 * 
 * @example
 * const { ref, isVisible, hasBeenVisible } = useIntersectionObserver({
 *   threshold: 0.1,
 *   rootMargin: '100px',
 * })
 * 
 * return (
 *   <div ref={ref}>
 *     {hasBeenVisible && <HeavyComponent />}
 *   </div>
 * )
 */

interface UseIntersectionObserverOptions {
  /** Threshold(s) at which to trigger callback */
  threshold?: number | number[]
  /** Root margin - extend/shrink the trigger area */
  rootMargin?: string
  /** Root element (defaults to viewport) */
  root?: Element | null
  /** Freeze after first intersection (for lazy loading) */
  freezeOnceVisible?: boolean
  /** Callback when visibility changes */
  onChange?: (isVisible: boolean, entry?: IntersectionObserverEntry) => void
}

interface UseIntersectionObserverReturn<T extends HTMLElement> {
  /** Ref to attach to the target element */
  ref: RefObject<T | null>
  /** Current visibility state */
  isVisible: boolean
  /** Whether element has ever been visible (for lazy loading) */
  hasBeenVisible: boolean
  /** Raw intersection entry */
  entry: IntersectionObserverEntry | null
  /** Intersection ratio (0-1) */
  ratio: number
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn<T> {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    freezeOnceVisible = true,
    onChange,
  } = options

  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [ratio, setRatio] = useState(0)

  // Memoize callback to prevent unnecessary effect re-runs
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (!entry) return

      const isIntersecting = entry.isIntersecting

      setEntry(entry)
      setRatio(entry.intersectionRatio)
      setIsVisible(isIntersecting)

      if (isIntersecting) {
        setHasBeenVisible(true)
      }

      onChange?.(isIntersecting, entry)
    },
    [onChange]
  )

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Skip if already visible and frozen
    if (freezeOnceVisible && hasBeenVisible) return

    // Check for native support
    if (!('IntersectionObserver' in window)) {
      // Fallback: immediately set as visible
      setIsVisible(true)
      setHasBeenVisible(true)
      return
    }

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
      root,
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, root, freezeOnceVisible, hasBeenVisible, handleIntersect])

  return { ref, isVisible, hasBeenVisible, entry, ratio }
}

/**
 * LAZY SCENE WRAPPER
 * 
 * A higher-order component for lazy rendering scenes.
 * Shows a placeholder until the scene enters the viewport.
 * 
 * @example
 * <LazyScene fallback={<Skeleton />} rootMargin="200px">
 *   <HeavyScene />
 * </LazyScene>
 */
interface LazySceneProps {
  children: React.ReactNode
  /** Fallback content while waiting to enter viewport */
  fallback?: React.ReactNode
  /** Root margin to pre-load before visible */
  rootMargin?: string
  /** Threshold for visibility */
  threshold?: number
  /** Minimum height to prevent layout shift */
  minHeight?: string | number
  /** Additional className */
  className?: string
}

export function LazyScene({
  children,
  fallback = null,
  rootMargin = '200px',
  threshold = 0,
  minHeight = '100vh',
  className = '',
}: LazySceneProps) {
  const { ref, hasBeenVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  })

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ minHeight }}
    >
      {hasBeenVisible ? children : fallback}
    </div>
  )
}

/**
 * SCROLL PROGRESS OBSERVER
 * 
 * Track scroll progress within an element's visibility range.
 * Useful for scroll-linked animations without Framer Motion.
 * 
 * @example
 * const { ref, progress } = useScrollProgress({ offset: ['start end', 'end start'] })
 */
interface UseScrollProgressOptions {
  /** When to start/end tracking */
  offset?: ['start end' | 'center end' | 'end end', 'start start' | 'center start' | 'end start']
}

interface UseScrollProgressReturn<T extends HTMLElement> {
  ref: RefObject<T | null>
  /** Scroll progress 0-1 within the element's range */
  progress: number
}

export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollProgressOptions = {}
): UseScrollProgressReturn<T> {
  const { offset = ['start end', 'end start'] } = options
  
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const calculateProgress = () => {
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Parse offset strings
      const parseOffset = (str: string, isStart: boolean) => {
        const [elementPos, viewportPos] = str.split(' ')
        
        let elementOffset = 0
        if (elementPos === 'start') elementOffset = 0
        else if (elementPos === 'center') elementOffset = rect.height / 2
        else if (elementPos === 'end') elementOffset = rect.height
        
        let viewportOffset = 0
        if (viewportPos === 'start') viewportOffset = 0
        else if (viewportPos === 'center') viewportOffset = windowHeight / 2
        else if (viewportPos === 'end') viewportOffset = windowHeight
        
        return isStart 
          ? rect.top + elementOffset - viewportOffset
          : rect.top + elementOffset - viewportOffset
      }
      
      const startPoint = parseOffset(offset[0], true)
      const endPoint = parseOffset(offset[1], false)
      
      const totalRange = endPoint - startPoint
      if (totalRange === 0) {
        setProgress(0)
        return
      }
      
      const currentProgress = -startPoint / totalRange
      setProgress(Math.max(0, Math.min(1, currentProgress)))
    }

    calculateProgress()

    window.addEventListener('scroll', calculateProgress, { passive: true })
    window.addEventListener('resize', calculateProgress, { passive: true })

    return () => {
      window.removeEventListener('scroll', calculateProgress)
      window.removeEventListener('resize', calculateProgress)
    }
  }, [offset])

  return { ref, progress }
}

export default useIntersectionObserver
