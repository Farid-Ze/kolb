import { memo, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import type { MotionValue, Variants } from 'framer-motion'

/**
 * PARALLAX SECTION COMPONENT
 * 
 * Creates depth through differential scroll speeds.
 * Multiple layers move at different rates for 3D-like effect.
 */

interface ParallaxLayerProps {
  children: React.ReactNode
  /** Speed multiplier: 0 = fixed, 1 = normal scroll, >1 = faster, <0 = reverse */
  speed?: number
  /** Additional className */
  className?: string
  /** Z-index for layering */
  zIndex?: number
}

/**
 * Individual parallax layer - use inside ParallaxSection
 */
export const ParallaxLayer = memo(function ParallaxLayer({
  children,
  speed = 0.5,
  className = '',
  zIndex = 0,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Transform based on speed - negative moves opposite direction
  const y = useTransform(smoothProgress, [0, 1], [`${speed * 100}px`, `${-speed * 100}px`])

  return (
    <motion.div
      ref={ref}
      className={`will-change-transform ${className}`}
      style={{ y, zIndex }}
    >
      {children}
    </motion.div>
  )
})

interface ParallaxSectionProps {
  children: React.ReactNode
  className?: string
  /** Background color/gradient */
  background?: string
}

/**
 * Container for parallax layers
 */
export const ParallaxSection = memo(function ParallaxSection({
  children,
  className = '',
  background,
}: ParallaxSectionProps) {
  return (
    <section 
      className={`relative overflow-hidden ${className}`}
      style={{ background }}
    >
      {children}
    </section>
  )
})

/**
 * REVEAL SECTION COMPONENT
 * 
 * Content reveals on scroll with various animation styles.
 */

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale' | 'blur'

interface RevealSectionProps {
  children: React.ReactNode
  className?: string
  /** Animation direction/style */
  direction?: RevealDirection
  /** Delay in seconds */
  delay?: number
  /** Duration in seconds */
  duration?: number
  /** Trigger threshold (0-1) */
  threshold?: number
  /** Only animate once */
  once?: boolean
}

const revealVariants: Record<RevealDirection, Variants> = {
  up: {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -60 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
}

export const RevealSection = memo(function RevealSection({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.6,
  threshold = 0.2,
  once = true,
}: RevealSectionProps) {
  const variants = revealVariants[direction]

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for smooth feel
      }}
    >
      {children}
    </motion.div>
  )
})

/**
 * STAGGER CONTAINER
 * 
 * Staggers child animations for list-like content
 */

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  /** Stagger delay between children */
  stagger?: number
  /** Initial delay */
  delay?: number
  /** Only animate once */
  once?: boolean
}

export const StaggerContainer = memo(function StaggerContainer({
  children,
  className = '',
  stagger = 0.1,
  delay = 0,
  once = true,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
})

export const StaggerItem = memo(function StaggerItem({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
})

/**
 * SCROLL PROGRESS SECTION
 * 
 * Section that provides its own scroll progress for child animations
 */

interface ScrollProgressSectionProps {
  children: (progress: MotionValue<number>) => React.ReactNode
  className?: string
  /** Offset for when tracking starts/ends */
  offset?: ['start' | 'end' | 'center', 'start' | 'end' | 'center'][]
}

export const ScrollProgressSection = memo(function ScrollProgressSection({
  children,
  className = '',
  offset = [['start', 'end'], ['end', 'start']],
}: ScrollProgressSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset.map(([a, b]) => `${a} ${b}`) as ["start end", "end start"],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  })

  return (
    <div ref={ref} className={className}>
      {children(smoothProgress)}
    </div>
  )
})

/**
 * HORIZONTAL SCROLL SECTION
 * 
 * Converts vertical scroll to horizontal movement
 */

interface HorizontalScrollProps {
  children: React.ReactNode
  className?: string
  /** Height of the scroll area (controls scroll distance) */
  scrollHeight?: string
}

export const HorizontalScroll = memo(function HorizontalScroll({
  children,
  className = '',
  scrollHeight = '300vh',
}: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-100%'])
  const smoothX = useSpring(x, { stiffness: 100, damping: 30 })

  return (
    <div 
      ref={containerRef} 
      className="relative"
      style={{ height: scrollHeight }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div 
          className={`flex h-full ${className}`}
          style={{ x: smoothX }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
})

export default ParallaxSection
