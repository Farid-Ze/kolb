import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AWWWARDS-LEVEL PRELOADER
 * 
 * Premium loading screen with:
 * - Animated ZENOTIKA logo
 * - Progress counter
 * - Smooth exit transition
 * - Matches dark theme
 */

interface PreloaderProps {
  /** Duration of the preloader in ms (default 2000) */
  duration?: number
  /** Callback when preloader completes */
  onComplete?: () => void
  /** Whether to show progress counter */
  showProgress?: boolean
}

export const Preloader = memo(function Preloader({
  duration = 2000,
  onComplete,
  showProgress = true,
}: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animate progress
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(100, Math.round((elapsed / duration) * 100))
      setProgress(newProgress)

      if (newProgress >= 100) {
        clearInterval(interval)
      }
    }, 16) // ~60fps

    // Complete after duration
    const timeout = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onComplete?.(), 500) // Wait for exit animation
    }, duration)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] bg-[#080810] flex flex-col items-center justify-center"
          aria-label="Loading"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Background glow - lightweight radial gradient instead of blur */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          {/* Logo container */}
          <div className="relative z-10">
            {/* Animated logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1 
              }}
              className="text-center"
            >
              {/* Main logo text */}
              <motion.h1 
                className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.02em]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-white">ZENOTIKA</span>
                <motion.span 
                  className="text-blue-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  ™
                </motion.span>
              </motion.h1>

              {/* Tagline */}
              <motion.p 
                className="mt-3 font-ui text-[10px] uppercase tracking-[0.3em] text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Innovation Partner
              </motion.p>
            </motion.div>

            {/* Progress bar */}
            <motion.div 
              className="mt-10 w-48 mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Progress text */}
              {showProgress && (
                <motion.p 
                  className="mt-3 font-mono text-[10px] text-gray-500 text-center tabular-nums"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {progress}%
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Bottom decorative text */}
          <motion.div
            className="absolute bottom-[calc(100vh/12)] left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="font-ui text-[9px] uppercase tracking-[0.2em] text-gray-600">
              Loading Experience
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

/**
 * Hook to manage preloader state
 */
export function usePreloader(duration = 2000) {
  const [isLoading, setIsLoading] = useState(true)

  const handleComplete = () => {
    setIsLoading(false)
  }

  return {
    isLoading,
    Preloader: isLoading ? (
      <Preloader duration={duration} onComplete={handleComplete} />
    ) : null,
  }
}

export default Preloader
