import { memo, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * AWWWARDS-LEVEL PAGE TRANSITIONS
 * 
 * Smooth route transitions inspired by Citrix Racing:
 * - Fade + slide up on enter
 * - Quick fade on exit
 * - Premium easing curves (custom cubic-bezier)
 * - Respects reduced motion preference
 */

// Citrix-style premium easing
const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: PREMIUM_EASE,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  },
}

// Reduced motion variants (instant transitions)
const reducedMotionVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

interface PageTransitionProps {
  children: ReactNode
  /** Unique key for the page (uses location.pathname by default) */
  pageKey?: string
  /** Custom variants for specific pages */
  variants?: typeof pageVariants
  /** Additional CSS class */
  className?: string
}

export const PageTransition = memo(function PageTransition({
  children,
  pageKey,
  variants,
  className = '',
}: PageTransitionProps) {
  const location = useLocation()
  const key = pageKey ?? location.pathname

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const activeVariants = prefersReducedMotion 
    ? reducedMotionVariants 
    : (variants ?? pageVariants)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={activeVariants}
        className={className}
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
})

/**
 * Page transition wrapper for layouts
 * Use this in App.tsx around the Outlet
 */
export const PageTransitionOutlet = memo(function PageTransitionOutlet({
  children,
}: {
  children: ReactNode
}) {
  const location = useLocation()

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const activeVariants = prefersReducedMotion
    ? reducedMotionVariants
    : pageVariants

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={activeVariants}
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
})

/**
 * Stagger children animation wrapper
 * Useful for lists, grids, card collections
 */
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: PREMIUM_EASE,
    },
  },
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  /** Delay before starting animations */
  delay?: number
}

export const StaggerContainer = memo(function StaggerContainer({
  children,
  className = '',
  delay = 0,
}: StaggerContainerProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        ...staggerContainerVariants,
        visible: {
          ...staggerContainerVariants.visible,
          transition: {
            ...staggerContainerVariants.visible.transition,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export const StaggerItem = memo(function StaggerItem({
  children,
  className = '',
}: StaggerItemProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  )
})

/**
 * Fade in on scroll component
 * Wraps content that should animate when entering viewport
 */
interface FadeInViewProps {
  children: ReactNode
  className?: string
  /** Animation delay in seconds */
  delay?: number
  /** Trigger threshold (0-1) */
  threshold?: number
}

export const FadeInView = memo(function FadeInView({
  children,
  className = '',
  delay = 0,
  threshold = 0.2,
}: FadeInViewProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.6, ease: PREMIUM_EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
})

export default PageTransition
