import { memo } from 'react'
import { LogOut, User } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuthContext } from '../providers/AuthContext'

const links = [
  { to: '/future/dashboard', label: 'Dashboard' },
  { to: '/future/tunnel', label: 'Assessment' },
  { to: '/sphere', label: 'Sphere' },
  { to: '/admin', label: 'Admin', requireMediator: true },
]

/**
 * AWWWARDS-LEVEL SHELL LAYOUT
 * 
 * Optimizations:
 * - Memoized navigation links
 * - GPU-only transitions (transform, opacity)
 * - CSS containment for layout isolation
 * - Framer Motion page transitions
 * - WCAG 2.1 AA accessibility (skip link, touch targets)
 */

// Premium page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  enter: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } 
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const } 
  },
}

// Memoized NavLinks to prevent re-render on parent state change
const NavigationLinks = memo(function NavigationLinks({ 
  links: navLinks,
  isMediator 
}: { 
  links: typeof links
  isMediator: boolean 
}) {
  const location = useLocation()
  const visibleLinks = navLinks.filter(link => {
    if (link.requireMediator) return isMediator
    return true
  })

  return (
    <nav 
      className="absolute left-1/2 -translate-x-1/2 hidden md:inline-flex items-center gap-6 lg:gap-8 contain-layout"
      aria-label="Main navigation"
    >
      {visibleLinks.map((link) => {
        const isActive = location.pathname.startsWith(link.to)
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={`relative font-ui text-[9px] sm:text-[10px] font-bold uppercase tracking-widest gpu-transition min-h-[44px] flex items-center ${
              isActive 
                ? 'text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {link.label}
            {/* Animated active indicator with layoutId */}
            {isActive && (
              <motion.span
                layoutId="nav-active-indicator"
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-blue-400 rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </NavLink>
        )
      })}
    </nav>
  )
})

export function ShellLayout() {
  const location = useLocation()
  const { isAuthenticated, isMediator, logout, remainingMs } = useAuthContext()

  const timeUntilLock = remainingMs ? Math.max(0, remainingMs - 45 * 60 * 1000) : 0
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white contain-layout">
      {/* Skip Link - WCAG Accessibility */}
      <a 
        href="#main-content" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded focus:font-ui focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      
      {/* HEADER - GPU optimized with containment */}
      <header 
        className="fixed z-50 top-0 left-0 w-full px-[8.33%] pt-[calc(100vh/24)] pb-4 flex justify-between items-start bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent contain-layout gpu-layer"
        role="banner"
      >
        {/* Logo Area - GPU transition */}
        <Link 
          to="/" 
          className="group inline-block gpu-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f] rounded-sm"
          aria-label="Zenotika - Go to homepage"
        >
          <h1 className="font-headline text-lg sm:text-xl md:text-2xl font-bold tracking-tighter text-white group-hover:text-blue-400 gpu-transition">
            ZENOTIKA<span className="text-blue-400">™</span>
          </h1>
          <p className="font-ui text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 mt-0.5">
            Innovation Partner
          </p>
        </Link>

        {/* Memoized Navigation */}
        <NavigationLinks links={links} isMediator={isMediator} />

        {/* Right Controls - GPU transitions with 44×44 touch targets */}
        <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-4">
          {isAuthenticated ? (
            <>
              {timeUntilLock > 0 && (
                <span className="font-mono text-[10px] text-gray-400 hidden sm:inline px-2" title="Session time remaining">
                  {formatTime(timeUntilLock)}
                </span>
              )}
              
              {/* Profile Button - 44×44 touch target */}
              <NavLink
                to="/me"
                className={({ isActive }) =>
                  `inline-flex items-center justify-center gap-2 group min-w-[44px] min-h-[44px] px-2 gpu-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm ${
                    isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                  }`
                }
                aria-label="Profile"
              >
                <User size={16} aria-hidden="true" />
                <span className="hidden sm:inline font-ui text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                  Profile
                </span>
              </NavLink>
              
              {/* Logout Button - 44×44 touch target */}
              <button
                className="inline-flex items-center justify-center gap-2 text-gray-400 hover:text-red-400 gpu-transition group min-w-[44px] min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-sm"
                onClick={logout}
                type="button"
                aria-label="Logout"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline font-ui text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                  Logout
                </span>
              </button>
            </>
          ) : (
            /* Menu Dots - 44×44 touch target */
            <Link 
              to="/auth" 
              className="relative inline-flex items-center justify-center cursor-pointer group min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
              aria-label="Sign in"
            >
              <div className="inline-flex gap-[3px] sm:gap-1" aria-hidden="true">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full group-hover:bg-blue-400 gpu-transition"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-60 group-hover:bg-blue-400 group-hover:opacity-100 gpu-transition"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-60 group-hover:bg-blue-400 group-hover:opacity-100 gpu-transition"></div>
              </div>
              <span className="ml-3 font-ui text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-blue-400 gpu-transition hidden md:inline">
                Sign In
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content - Animated transitions */}
      <main id="main-content" className="mx-auto max-w-7xl px-[8.33%] pt-32 pb-12 contain-paint">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
            style={{ willChange: 'opacity, transform' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
