import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * IGLOO.INC-STYLE INTERSECTION OBSERVER HOOK
 * 
 * Mathematical optimization for scroll-triggered animations:
 * - Lazy animation activation (only animate when visible)
 * - Single observer instance (memory efficient)
 * - Threshold-based triggering (GPU layer promotion only when needed)
 * - Automatic cleanup (prevents memory leaks)
 * 
 * @example
 * const { ref, isVisible } = useIntersectionAnimation({ threshold: 0.1 })
 * <div ref={ref} className={isVisible ? 'animate-fade-in' : 'opacity-0'}>
 */

interface UseIntersectionAnimationOptions {
  /** Visibility threshold (0-1). Default 0.1 = 10% visible */
  threshold?: number
  /** Root margin for early/late triggering. Default '0px' */
  rootMargin?: string
  /** Only trigger once. Default true (most animations) */
  triggerOnce?: boolean
  /** Disable in reduced motion. Default true */
  respectReducedMotion?: boolean
}

interface UseIntersectionAnimationResult<T extends HTMLElement> {
  ref: React.RefObject<T>
  isVisible: boolean
  hasAnimated: boolean
}

export function useIntersectionAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionAnimationOptions = {}
): UseIntersectionAnimationResult<T> {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    respectReducedMotion = true,
  } = options

  const ref = useRef<T>(null)
  
  // Check reduced motion preference - memoized
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
  
  // Initialize state based on reduced motion preference
  const shouldSkipAnimation = respectReducedMotion && 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  
  const [isVisible, setIsVisible] = useState(shouldSkipAnimation)
  const [hasAnimated, setHasAnimated] = useState(shouldSkipAnimation)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Already animated and triggerOnce is true, or skipping animations
    if ((triggerOnce && hasAnimated) || (respectReducedMotion && prefersReducedMotion())) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            setHasAnimated(true)

            if (triggerOnce) {
              observer.unobserve(element)
            }
          } else if (!triggerOnce) {
            setIsVisible(false)
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce, hasAnimated, prefersReducedMotion, respectReducedMotion])

  return { ref: ref as React.RefObject<T>, isVisible, hasAnimated }
}

/**
 * Hook for staggered animations (multiple elements)
 * 
 * @example
 * const items = ['a', 'b', 'c']
 * const { containerRef, getItemProps } = useStaggeredAnimation(items.length)
 * 
 * <div ref={containerRef}>
 *   {items.map((item, i) => (
 *     <div key={i} {...getItemProps(i)}>{item}</div>
 *   ))}
 * </div>
 */
interface UseStaggeredAnimationOptions {
  /** Base delay in ms. Default 100 */
  baseDelay?: number
  /** Delay increment per item in ms. Default 75 */
  staggerDelay?: number
  /** Visibility threshold. Default 0.1 */
  threshold?: number
}

export function useStaggeredAnimation<T extends HTMLElement = HTMLDivElement>(
  _itemCount: number,
  options: UseStaggeredAnimationOptions = {}
) {
  const {
    baseDelay = 100,
    staggerDelay = 75,
    threshold = 0.1,
  } = options

  const { ref: containerRef, isVisible } = useIntersectionAnimation<T>({ threshold })

  const getItemProps = useCallback(
    (index: number) => ({
      style: {
        animationDelay: isVisible ? `${baseDelay + index * staggerDelay}ms` : '0ms',
        opacity: isVisible ? undefined : 0,
      },
      className: isVisible ? 'animate-hero-fade-up' : '',
    }),
    [isVisible, baseDelay, staggerDelay]
  )

  return { containerRef, isVisible, getItemProps }
}
