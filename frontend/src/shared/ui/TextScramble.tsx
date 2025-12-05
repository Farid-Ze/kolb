import { memo, useEffect, useState, useCallback } from 'react'

/**
 * AWWWARDS-LEVEL TEXT SCRAMBLE
 * 
 * Premium text reveal effect inspired by Kenta Toshikura:
 * - Characters scramble through random glyphs
 * - Reveals from left to right
 * - Configurable speed and delay
 * - GPU-optimized with CSS
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'

interface TextScrambleProps {
  /** The text to reveal */
  text: string
  /** Delay before starting animation (seconds) */
  delay?: number
  /** Speed of character iteration (ms per frame, lower = faster) */
  speed?: number
  /** Number of iterations per character before revealing */
  iterations?: number
  /** Callback when animation completes */
  onComplete?: () => void
  /** CSS class for the container */
  className?: string
  /** Whether to trigger animation (for controlled usage) */
  trigger?: boolean
}

export const TextScramble = memo(function TextScramble({
  text,
  delay = 0,
  speed = 30,
  iterations = 3,
  onComplete,
  className = '',
  trigger = true,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const scramble = useCallback(() => {
    let currentIteration = 0
    const totalIterations = text.length * iterations

    const interval = setInterval(() => {
      const progress = currentIteration / iterations
      
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            // Keep spaces as spaces
            if (char === ' ') return ' '
            
            // Characters before progress point are revealed
            if (index < progress) return char
            
            // Characters at progress point scramble
            if (index < progress + 1) {
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            }
            
            // Characters after are still scrambling (or empty for cleaner effect)
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          })
          .join('')
      )

      currentIteration++

      if (currentIteration > totalIterations) {
        clearInterval(interval)
        setDisplayText(text)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, iterations, onComplete])

  useEffect(() => {
    if (!trigger) {
      setDisplayText('')
      setIsComplete(false)
      return
    }

    // Start with empty or scrambled
    setDisplayText(text.split('').map(c => c === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]).join(''))
    
    const timeout = setTimeout(scramble, delay * 1000)
    return () => clearTimeout(timeout)
  }, [trigger, delay, scramble, text])

  return (
    <span 
      className={className}
      data-scramble-complete={isComplete}
      aria-label={text}
    >
      {displayText || text}
    </span>
  )
})

/**
 * Text scramble that reveals on scroll into view
 */
interface TextScrambleOnViewProps extends Omit<TextScrambleProps, 'trigger'> {
  /** Viewport threshold for triggering (0-1) */
  threshold?: number
}

export const TextScrambleOnView = memo(function TextScrambleOnView({
  threshold = 0.5,
  ...props
}: TextScrambleOnViewProps) {
  const [isInView, setIsInView] = useState(false)
  const [ref, setRef] = useState<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, threshold])

  return (
    <span ref={setRef}>
      <TextScramble {...props} trigger={isInView} />
    </span>
  )
})

/**
 * Staggered text scramble for multiple words/lines
 */
interface StaggeredScrambleProps {
  /** Array of text strings to scramble */
  lines: string[]
  /** Delay between each line starting (seconds) */
  stagger?: number
  /** Initial delay before first line (seconds) */
  initialDelay?: number
  /** Props passed to each TextScramble */
  scrambleProps?: Omit<TextScrambleProps, 'text' | 'delay' | 'trigger'>
  /** Class for the container */
  className?: string
  /** Class for each line */
  lineClassName?: string
}

export const StaggeredScramble = memo(function StaggeredScramble({
  lines,
  stagger = 0.15,
  initialDelay = 0,
  scrambleProps = {},
  className = '',
  lineClassName = '',
}: StaggeredScrambleProps) {
  return (
    <div className={className}>
      {lines.map((line, index) => (
        <div key={index} className={lineClassName}>
          <TextScramble
            text={line}
            delay={initialDelay + index * stagger}
            {...scrambleProps}
          />
        </div>
      ))}
    </div>
  )
})

export default TextScramble
