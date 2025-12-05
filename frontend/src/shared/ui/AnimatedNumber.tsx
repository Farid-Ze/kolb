import { memo, useEffect, useRef } from 'react'
import { 
  useMotionValue, 
  useSpring, 
  useTransform, 
  useInView,
  motion 
} from 'framer-motion'

/**
 * AWWWARDS-LEVEL ANIMATED NUMBER
 * 
 * Counter animation for stats/metrics:
 * - Spring physics for organic feel
 * - Scroll-triggered (only animates when visible)
 * - Locale-aware formatting
 * - GPU-optimized
 */

interface AnimatedNumberProps {
  /** Target value to animate to */
  value: number
  /** Spring stiffness (default: 100) */
  stiffness?: number
  /** Spring damping (default: 30) */
  damping?: number
  /** Delay before starting animation in seconds */
  delay?: number
  /** Format function (default: toLocaleString) */
  format?: (value: number) => string
  /** Additional CSS classes */
  className?: string
  /** Prefix (e.g., "$", "+") */
  prefix?: string
  /** Suffix (e.g., "%", "K") */
  suffix?: string
}

export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  stiffness = 100,
  damping = 30,
  delay = 0,
  format = (v) => Math.round(v).toLocaleString(),
  className,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness, damping })
  const displayValue = useTransform(springValue, (v) => format(v))

  useEffect(() => {
    if (isInView) {
      // Delay the animation start if specified
      const timeout = setTimeout(() => {
        motionValue.set(value)
      }, delay * 1000)
      
      return () => clearTimeout(timeout)
    }
  }, [isInView, value, motionValue, delay])

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span className="tabular-nums">{displayValue}</motion.span>
      {suffix}
    </span>
  )
})

/**
 * Percentage variant with % suffix
 */
export const AnimatedPercentage = memo(function AnimatedPercentage(
  props: Omit<AnimatedNumberProps, 'suffix'>
) {
  return <AnimatedNumber {...props} suffix="%" />
})

/**
 * Currency variant with $ prefix
 */
export const AnimatedCurrency = memo(function AnimatedCurrency(
  props: Omit<AnimatedNumberProps, 'prefix' | 'format'>
) {
  return (
    <AnimatedNumber 
      {...props} 
      prefix="$" 
      format={(v) => Math.round(v).toLocaleString()}
    />
  )
})

/**
 * Compact number format (1K, 1M, etc.)
 */
export const AnimatedCompactNumber = memo(function AnimatedCompactNumber(
  props: Omit<AnimatedNumberProps, 'format'>
) {
  const compactFormat = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
    return Math.round(v).toString()
  }
  
  return <AnimatedNumber {...props} format={compactFormat} />
})

export default AnimatedNumber
