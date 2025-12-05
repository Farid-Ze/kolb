/**
 * PERFORMANCE MONITORING UTILITIES
 * Inspired by igloo.inc's performance-first architecture
 * 
 * Tools for measuring and optimizing:
 * - Frame rate (FPS)
 * - Long tasks detection
 * - Layout thrashing detection
 * - GPU memory estimation
 */

type PerformanceCallback = (metrics: PerformanceMetrics) => void

interface PerformanceMetrics {
  fps: number
  frameTime: number
  longTasks: number
  timestamp: number
}

/**
 * FPS Monitor - measures actual frame rate
 * Use during development to identify animation jank
 * 
 * @example
 * const stop = measureFPS((metrics) => {
 *   if (metrics.fps < 55) console.warn('FPS drop:', metrics.fps)
 * })
 * // Later: stop()
 */
export function measureFPS(callback: PerformanceCallback): () => void {
  let frameCount = 0
  let lastTime = performance.now()
  let longTaskCount = 0
  let rafId: number

  // Long Task Observer (tasks > 50ms block main thread)
  let longTaskObserver: PerformanceObserver | null = null
  
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        longTaskCount += list.getEntries().length
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    } catch {
      // Long task observation not supported
    }
  }

  function tick() {
    frameCount++
    const currentTime = performance.now()
    const elapsed = currentTime - lastTime

    // Report every second
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount * 1000) / elapsed)
      const frameTime = elapsed / frameCount

      callback({
        fps,
        frameTime,
        longTasks: longTaskCount,
        timestamp: currentTime,
      })

      frameCount = 0
      longTaskCount = 0
      lastTime = currentTime
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(rafId)
    longTaskObserver?.disconnect()
  }
}

/**
 * Measure paint performance for a specific operation
 * 
 * @example
 * await measurePaint('hero-animation', () => {
 *   element.classList.add('animate')
 * })
 */
export async function measurePaint(
  label: string,
  operation: () => void
): Promise<{ paintTime: number; layoutTime: number }> {
  // Force style recalculation before measurement
  void document.body.offsetHeight

  const startTime = performance.now()
  
  operation()
  
  // Force layout/paint to complete
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })

  const endTime = performance.now()
  const totalTime = endTime - startTime

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Paint] ${label}: ${totalTime.toFixed(2)}ms`)
  }

  return {
    paintTime: totalTime,
    layoutTime: totalTime, // Simplified - would need more detailed measurement
  }
}

/**
 * Detect layout thrashing (forced synchronous layouts)
 * 
 * Layout thrashing occurs when you:
 * 1. Write to DOM (change style/class)
 * 2. Read from DOM (offsetHeight, getBoundingClientRect)
 * 3. Repeat in a loop
 * 
 * This forces browser to recalculate layout multiple times per frame
 * 
 * @example
 * // BAD - causes thrashing:
 * elements.forEach(el => {
 *   el.style.height = el.offsetHeight + 10 + 'px' // Read + Write in loop!
 * })
 * 
 * // GOOD - batch reads, then writes:
 * const heights = elements.map(el => el.offsetHeight) // All reads
 * elements.forEach((el, i) => {
 *   el.style.height = heights[i] + 10 + 'px' // All writes
 * })
 */
export function detectLayoutThrashing(): () => void {
  if (process.env.NODE_ENV !== 'development') {
    return () => {}
  }

  let lastOperation: 'read' | 'write' | null = null
  let thrashCount = 0

  const originalGetComputedStyle = window.getComputedStyle
  window.getComputedStyle = function(...args) {
    if (lastOperation === 'write') {
      thrashCount++
      console.warn('[Layout Thrash] getComputedStyle after style write')
    }
    lastOperation = 'read'
    return originalGetComputedStyle.apply(this, args)
  }

  // Log thrashing stats every 5 seconds
  const interval = setInterval(() => {
    if (thrashCount > 0) {
      console.warn(`[Layout Thrash] ${thrashCount} thrashes detected in last 5s`)
    }
    thrashCount = 0
    lastOperation = null
  }, 5000)

  return () => {
    window.getComputedStyle = originalGetComputedStyle
    clearInterval(interval)
  }
}

/**
 * Check if hardware acceleration is likely active
 * Returns hints about GPU usage
 */
export function checkGPUAcceleration(element: HTMLElement): {
  hasTransform3d: boolean
  hasWillChange: boolean
  hasOpacity: boolean
  likelyGPUAccelerated: boolean
} {
  const style = window.getComputedStyle(element)
  
  const hasTransform3d = 
    style.transform.includes('matrix3d') ||
    style.transform.includes('translate3d') ||
    style.transform.includes('translateZ')
  
  const hasWillChange = style.willChange !== 'auto'
  const hasOpacity = parseFloat(style.opacity) < 1

  return {
    hasTransform3d,
    hasWillChange,
    hasOpacity,
    likelyGPUAccelerated: hasTransform3d || hasWillChange || hasOpacity,
  }
}
