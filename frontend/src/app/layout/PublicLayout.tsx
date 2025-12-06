import { memo } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SpeedTunnel } from '../../shared/ui/SpeedTunnel'

/**
 * AWWWARDS-LEVEL PUBLIC LAYOUT
 * 
 * Design Decisions:
 * - 8.33% horizontal padding (12-column grid)
 * - pt-[calc(100vh/12)] vertical rhythm
 * - Micro-interactions on all interactive elements
 * - GPU-only animations for 60fps
 * - WCAG 2.1 AA accessibility
 * - Page transitions with Framer Motion
 */

// Premium page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const } 
  },
}

// Memoized background - zero re-renders
const OptimizedBackground = memo(function OptimizedBackground() {
  return (
    <div 
      className="absolute inset-0 contain-strict" 
      aria-hidden="true"
      role="presentation"
    >
      {/* Layered gradients for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(59, 130, 246, 0.04) 0%, transparent 40%),
            radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.85) 100%),
            linear-gradient(180deg, #080810 0%, #0a0a14 50%, #080810 100%)
          `
        }}
      />
      
      {/* Subtle grid texture */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          transform: 'translateZ(0)',
        }}
      />
      
      {/* Noise texture overlay for premium feel */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
})

export function PublicLayout() {
  const location = useLocation()
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#080810] text-white selection:bg-indigo-500/80 selection:text-white isolate-layer">
      {/* Skip Link - WCAG Accessibility */}
      <a 
        href="#main-content" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-indigo-500 focus:text-white focus:rounded focus:font-ui focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      
      {/* Animated Background - SpeedTunnel */}
      <SpeedTunnel />
      
      {/* Static Background Layer */}
      <OptimizedBackground />
      
      {/* HEADER - Citrix Pattern */}
      <header 
        className="absolute z-20 top-0 left-0 w-full px-[8.33%] pt-[calc(100vh/12)] flex justify-between items-start contain-layout"
        role="banner"
      >
        {/* Logo - Primary Navigation with Spring Hover */}
        <Link 
          to="/" 
          className="group inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080810] rounded-sm"
          aria-label="Zenotika - Go to homepage"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <h1 className="font-headline text-lg sm:text-xl md:text-2xl font-bold tracking-[-0.02em] text-white group-hover:text-indigo-400 gpu-transition">
              ZENOTIKA<span className="text-indigo-400 group-hover:text-white gpu-transition">™</span>
            </h1>
            <p className="font-ui text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-1 group-hover:text-gray-400 gpu-transition">
              Innovation Partner
            </p>
          </motion.div>
        </Link>

        {/* Right Controls */}
        <nav className="inline-flex items-center gap-6 sm:gap-8" aria-label="Header controls">
          {/* Sound Toggle */}
          <button 
            type="button" 
            className="inline-flex items-center gap-3 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm p-1 -m-1"
            aria-label="Toggle sound"
          >
            {/* Sound Bars - CSS-only animation */}
            <div className="inline-flex items-end gap-[3px] h-4 mr-1 hidden sm:inline-flex" aria-hidden="true">
              <div className="w-[2px] bg-white group-hover:bg-indigo-400 bar-1 gpu-transition rounded-full"></div>
              <div className="w-[2px] bg-white group-hover:bg-indigo-400 bar-2 gpu-transition rounded-full"></div>
              <div className="w-[2px] bg-white group-hover:bg-indigo-400 bar-3 gpu-transition rounded-full"></div>
              <div className="w-[2px] bg-white group-hover:bg-indigo-400 bar-4 gpu-transition rounded-full"></div>
            </div>
            <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.15em] text-white group-hover:text-indigo-400 gpu-transition">
              Sound
            </span>
          </button>

          {/* Menu Dots - Link to Auth (44×44 touch target) */}
          <Link 
            to="/auth" 
            className="relative inline-flex items-center justify-center w-11 h-11 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-sm -m-2"
            aria-label="Open menu"
          >
            {/* Dots Container */}
            <div className="inline-flex gap-1" aria-hidden="true">
              <div className="w-2 h-2 bg-white rounded-full group-hover:bg-indigo-400 group-hover:scale-110 gpu-transition transform-gpu"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-indigo-400 group-hover:opacity-100 group-hover:scale-110 gpu-transition transform-gpu transition-all delay-75"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-indigo-400 group-hover:opacity-100 group-hover:scale-110 gpu-transition transform-gpu transition-all delay-100"></div>
            </div>
            
            {/* Hover Label */}
            <span 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 font-ui text-[9px] font-semibold uppercase tracking-[0.15em] text-white opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 gpu-transition hidden md:block whitespace-nowrap pointer-events-none"
              aria-hidden="true"
            >
              Menu
            </span>
          </Link>
        </nav>
      </header>

      {/* Page Content with Animated Transitions */}
      <main id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
