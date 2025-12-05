import { memo, useRef, useState, useCallback, type ReactNode, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * AWWWARDS-LEVEL MAGNETIC BUTTON
 * 
 * Premium interaction inspired by Studio Details Japan:
 * - Mouse-following magnetic effect
 * - Smooth lerp-based animation
 * - Customizable strength and radius
 * - Works with any button content
 * - GPU-accelerated transforms
 */

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  /** Magnetic pull strength (0-1, default 0.3) */
  strength?: number
  /** Magnetic field radius in pixels (default 100) */
  radius?: number
  /** Whether to disable magnetic effect */
  disabled?: boolean
  /** Show loading spinner */
  isLoading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
}

export const MagneticButton = memo(function MagneticButton({
  children,
  className = '',
  strength = 0.3,
  radius = 100,
  disabled = false,
  isLoading = false,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  
  const isDisabled = disabled || isLoading

  const handleMouseMove = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return
    
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

    // Only apply magnetic effect within radius
    if (distance < radius) {
      const pullStrength = (1 - distance / radius) * strength
      setPosition({
        x: distanceX * pullStrength,
        y: distanceY * pullStrength,
      })
    }
  }, [isDisabled, radius, strength])

  const handleMouseEnter = useCallback(() => {
    if (!isDisabled) {
      setIsHovering(true)
    }
  }, [isDisabled])

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 })
    setIsHovering(false)
  }, [])

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: position.x,
        y: position.y,
        scale: isHovering ? 1.02 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 15,
        mass: 0.5,
      }}
      disabled={isDisabled}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center gap-2',
        'font-ui text-sm font-semibold uppercase tracking-[0.1em]',
        'px-6 py-3 rounded-full',
        'border border-white/10 bg-white/[0.03]',
        'text-white',
        // Hover states
        'hover:bg-white/[0.08] hover:border-white/20',
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810]',
        // Disabled states
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // GPU optimization
        'will-change-transform transform-gpu',
        className
      )}
      style={{ willChange: 'transform' }}
    >
      {/* Glow effect on hover */}
      <motion.span
        className="absolute inset-0 rounded-full bg-blue-500/0 blur-xl -z-10"
        animate={{
          backgroundColor: isHovering ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0)',
        }}
        transition={{ duration: 0.3 }}
        aria-hidden="true"
      />
      
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  )
})

/**
 * Magnetic CTA variant with arrow
 * Matches Citrix "Scroll to Explore" pattern
 */
interface MagneticCTAProps extends Omit<MagneticButtonProps, 'children'> {
  label: string
  /** Show animated arrow */
  showArrow?: boolean
}

export const MagneticCTA = memo(function MagneticCTA({
  label,
  showArrow = true,
  className = '',
  ...props
}: MagneticCTAProps) {
  return (
    <MagneticButton
      className={cn(
        'group gap-4',
        className
      )}
      {...props}
    >
      <span>{label}</span>
      
      {showArrow && (
        <>
          {/* Animated line */}
          <span className="relative w-12 h-[1px] bg-white/30 overflow-hidden">
            <motion.span
              className="absolute inset-0 bg-white"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </span>
          
          {/* Arrow */}
          <motion.svg
            className="w-4 h-4"
            viewBox="0 0 16 16"
            fill="none"
            animate={{ x: [0, 4, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <path
              d="M1 8h14M9 2l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </>
      )}
    </MagneticButton>
  )
})

export default MagneticButton
