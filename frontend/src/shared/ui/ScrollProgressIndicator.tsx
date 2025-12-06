import { memo } from 'react'
import { motion } from 'framer-motion'

interface ScrollProgressIndicatorProps {
  /** Current scroll progress (0-1) */
  progress: number
  /** Position: left or right */
  position?: 'left' | 'right'
  /** Show percentage text */
  showPercentage?: boolean
  /** Labels for key milestones */
  milestones?: Array<{ at: number; label: string }>
}

/**
 * Scroll Progress Indicator
 * 
 * Visual indicator showing scroll position, inspired by high-end sites.
 * Shows a vertical line with progress marker and optional milestones.
 */
export const ScrollProgressIndicator = memo(function ScrollProgressIndicator({
  progress,
  position = 'right',
  showPercentage = false,
  milestones = [],
}: ScrollProgressIndicatorProps) {
  const positionClass = position === 'left' ? 'left-6' : 'right-6'

  return (
    <div 
      className={`fixed ${positionClass} top-1/2 -translate-y-1/2 z-40 pointer-events-none hidden md:flex flex-col items-center gap-2`}
      aria-hidden="true"
    >
      {/* Track */}
      <div className="relative w-px h-32 bg-white/10 rounded-full overflow-hidden">
        {/* Progress fill */}
        <motion.div
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full"
          style={{ height: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
        
        {/* Milestones */}
        {milestones.map((milestone, i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 w-2 h-px bg-white/20"
            style={{ bottom: `${milestone.at * 100}%` }}
          />
        ))}
      </div>

      {/* Current position marker */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-white shadow-lg"
        style={{
          bottom: `${progress * 128}px`, // 128px = h-32
          left: '50%',
          x: '-50%',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {/* Percentage */}
      {showPercentage && (
        <span className="text-xs font-mono text-white/40 mt-2">
          {Math.round(progress * 100)}%
        </span>
      )}
    </div>
  )
})

/**
 * Timeline Dots Navigation
 * 
 * Dot indicators for section navigation, common in landing pages.
 */
interface TimelineDotsProps {
  /** Total number of sections */
  sections: number
  /** Current active section (0-indexed) */
  activeIndex: number
  /** Callback when dot is clicked */
  onDotClick?: (index: number) => void
  /** Section labels for accessibility */
  labels?: string[]
}

export const TimelineDots = memo(function TimelineDots({
  sections,
  activeIndex,
  onDotClick,
  labels = [],
}: TimelineDotsProps) {
  return (
    <nav 
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3"
      aria-label="Page sections"
    >
      {Array.from({ length: sections }, (_, i) => (
        <button
          key={i}
          onClick={() => onDotClick?.(i)}
          className="group relative p-1"
          aria-label={labels[i] || `Section ${i + 1}`}
          aria-current={i === activeIndex ? 'true' : undefined}
        >
          {/* Dot */}
          <motion.span
            className={`block w-2 h-2 rounded-full transition-colors duration-300 ${
              i === activeIndex 
                ? 'bg-white' 
                : 'bg-white/20 group-hover:bg-white/40'
            }`}
            animate={{
              scale: i === activeIndex ? 1.5 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />

          {/* Label tooltip */}
          {labels[i] && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-white/80 bg-black/50 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {labels[i]}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
})

export default ScrollProgressIndicator
