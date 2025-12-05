import { createContext, useContext, useEffect, useRef, useState, useMemo, type ReactNode } from 'react'
import Lenis from 'lenis'

/**
 * AWWWARDS-LEVEL SMOOTH SCROLL PROVIDER
 * 
 * Powered by Lenis for buttery smooth scrolling:
 * - Lerp-based interpolation for silky movement
 * - Momentum preservation
 * - Touch-friendly on mobile
 * - Respects reduced motion preference
 * 
 * Reference: Citrix Red Bull Racing, Studio Details Japan
 */

interface SmoothScrollContextType {
  lenis: Lenis | null
  /** Scroll to a specific element or position */
  scrollTo: (target: string | number | HTMLElement, options?: ScrollToOptions) => void
  /** Stop scroll immediately */
  stop: () => void
  /** Resume scroll after stop */
  start: () => void
}

interface ScrollToOptions {
  offset?: number
  duration?: number
  immediate?: boolean
  lock?: boolean
  force?: boolean
  onComplete?: () => void
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
})

export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}

interface SmoothScrollProviderProps {
  children: ReactNode
  /** Disable smooth scroll entirely (for modals, etc.) */
  disabled?: boolean
}

export function SmoothScrollProvider({ children, disabled = false }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (disabled || prefersReducedMotion) {
      return
    }

    // Initialize Lenis with Awwwards-level settings
    const lenis = new Lenis({
      // Smoothness factor (0.05 = very smooth, 0.2 = snappier)
      lerp: 0.08,
      // Duration for scrollTo animations
      duration: 1.2,
      // Easing for programmatic scrolling
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Orientation (vertical only for this site)
      orientation: 'vertical',
      // Gesture orientation (touch devices)
      gestureOrientation: 'vertical',
      // Smooth wheel scrolling
      smoothWheel: true,
      // Wheel multiplier
      wheelMultiplier: 1,
      // Touch multiplier (make touch feel natural)
      touchMultiplier: 2,
      // Infinite scroll (false for standard pages)
      infinite: false,
    })

    lenisRef.current = lenis
    setIsReady(true)

    // RAF loop for Lenis
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Cleanup
    return () => {
      lenis.destroy()
      lenisRef.current = null
      setIsReady(false)
    }
  }, [disabled])

  const scrollTo = (
    target: string | number | HTMLElement,
    options?: ScrollToOptions
  ) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options)
    } else {
      // Fallback for native scroll
      if (typeof target === 'string') {
        const element = document.querySelector(target)
        element?.scrollIntoView({ behavior: 'smooth' })
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' })
      } else {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const stop = () => {
    lenisRef.current?.stop()
  }

  const start = () => {
    lenisRef.current?.start()
  }

  // Memoize context value to prevent unnecessary re-renders
  // Use a getter pattern to access ref safely
  const contextValue = useMemo<SmoothScrollContextType>(() => ({
    get lenis() { return lenisRef.current },
    scrollTo,
    stop,
    start,
  }), [isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      {children}
    </SmoothScrollContext.Provider>
  )
}

/**
 * Hook to scroll to top on route change
 * Use in App.tsx or layout components
 */
export function useScrollToTop() {
  const { scrollTo } = useSmoothScroll()

  const scrollToTop = (immediate = false) => {
    scrollTo(0, { immediate, duration: immediate ? 0 : 0.8 })
  }

  return scrollToTop
}

/**
 * Hook for parallax effects based on scroll position
 * Returns a value from 0 to 1 based on scroll progress
 */
export function useScrollProgress(elementRef: React.RefObject<HTMLElement | null>) {
  const { lenis } = useSmoothScroll()

  useEffect(() => {
    if (!lenis || !elementRef.current) return

    const handleScroll = () => {
      const element = elementRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Calculate progress: 0 when element enters viewport, 1 when it leaves
      const progress = Math.max(0, Math.min(1, 
        1 - (rect.bottom / (windowHeight + rect.height))
      ))

      element.style.setProperty('--scroll-progress', String(progress))
    }

    lenis.on('scroll', handleScroll)
    handleScroll() // Initial call

    return () => {
      lenis.off('scroll', handleScroll)
    }
  }, [lenis, elementRef])
}

export default SmoothScrollProvider
