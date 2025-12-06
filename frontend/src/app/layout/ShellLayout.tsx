/**
 * MASTER-LEVEL SHELL LAYOUT
 * 
 * Linear-style collapsible sidebar + Vercel-style breadcrumb header
 * 
 * Design Philosophy:
 * - Sidebar: Collapsible, icon-only when collapsed, with smooth animations
 * - Header: Minimal with breadcrumbs and quick actions
 * - Content: Maximum space utilization with elegant transitions
 * 
 * Inspired by: Linear, Vercel, Raycast
 */

import { memo, useState, useCallback, createContext, useContext } from 'react'
import { 
  LogOut, 
  User, 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Compass,
  Globe2,
  Settings,
  Command,
  Sparkles,
  Menu
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { useAuthContext } from '../providers/AuthContext'

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR STATE CONTEXT
// ═══════════════════════════════════════════════════════════════════

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within SidebarProvider')
  return context
}

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION DATA
// ═══════════════════════════════════════════════════════════════════

const navItems = [
  { 
    to: '/future/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Your learning overview'
  },
  { 
    to: '/future/tunnel', 
    label: 'Assessment', 
    icon: Compass,
    description: 'Take the KLSI assessment'
  },
  { 
    to: '/sphere', 
    label: 'Sphere', 
    icon: Globe2,
    description: 'Reflection gallery'
  },
  { 
    to: '/admin', 
    label: 'Admin', 
    icon: Settings,
    description: 'System administration',
    requireMediator: true
  },
]

// ═══════════════════════════════════════════════════════════════════
// PAGE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════

const pageVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  enter: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } 
  },
  exit: { 
    opacity: 0, 
    y: -4, 
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const } 
  },
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════

const Sidebar = memo(function Sidebar() {
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebar()
  const { isMediator, logout, isAuthenticated } = useAuthContext()
  const location = useLocation()

  const visibleItems = navItems.filter(item => {
    if (item.requireMediator) return isMediator
    return true
  })

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 72 : 240,
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -240 : 0)
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`
          fixed top-0 left-0 z-50 h-screen
          flex flex-col
          bg-[#0c0c14]/95 backdrop-blur-xl
          border-r border-white/[0.06]
          lg:relative lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
          >
            {/* Logo Icon */}
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Sparkles size={18} className="text-white" />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-lg -z-10" />
            </div>
            
            {/* Brand Text */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="font-headline text-lg font-bold text-white tracking-tight">
                    ZENOTIKA
                  </span>
                  <span className="text-indigo-400 text-sm">™</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapse Button - Desktop only */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            const Icon = item.icon
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-white/[0.08] text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg
                  ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'group-hover:bg-white/[0.04]'}
                  transition-colors
                `}>
                  <Icon size={18} />
                </div>
                
                {/* Label */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 min-w-0"
                    >
                      <span className="block text-sm font-medium truncate">
                        {item.label}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {item.description}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 rounded-lg bg-[#1a1a24] border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    <span className="block text-xs text-gray-400">{item.description}</span>
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.04]">
          {isAuthenticated ? (
            <div className="space-y-1">
              {/* Profile */}
              <NavLink
                to="/me"
                className={({ isActive }) => `
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-white/[0.08] text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500">
                  <User size={16} className="text-white" />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium"
                    >
                      Profile
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-red-500/20 transition-colors">
                  <LogOut size={16} />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-medium"
                    >
                      Logout
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20">
                <User size={16} />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-medium"
                  >
                    Sign In
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}

          {/* Keyboard Shortcut Hint */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 px-3"
              >
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 font-mono">
                    ⌘
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 font-mono">
                    K
                  </kbd>
                  <span>Quick actions</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  )
})

// ═══════════════════════════════════════════════════════════════════
// HEADER / BREADCRUMB BAR
// ═══════════════════════════════════════════════════════════════════

const Header = memo(function Header() {
  const { setMobileOpen } = useSidebar()
  const { remainingMs } = useAuthContext()
  const location = useLocation()

  // Build breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
    path: '/' + pathSegments.slice(0, index + 1).join('/'),
    isLast: index === pathSegments.length - 1
  }))

  const timeUntilLock = remainingMs ? Math.max(0, remainingMs - 45 * 60 * 1000) : 0
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.04]">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link 
            to="/" 
            className="text-gray-500 hover:text-white transition-colors"
          >
            Home
          </Link>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.path} className="flex items-center gap-2">
              <span className="text-gray-600">/</span>
              {crumb.isLast ? (
                <span className="text-white font-medium">{crumb.label}</span>
              ) : (
                <Link 
                  to={crumb.path}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Session Timer */}
        {timeUntilLock > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs font-mono text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {formatTime(timeUntilLock)}
          </span>
        )}

        {/* Command Palette Trigger */}
        <button 
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Open command palette"
        >
          <Command size={14} />
          <span className="text-xs">Search...</span>
          <div className="flex items-center gap-0.5 ml-2">
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-white/[0.08] border border-white/10">⌘</kbd>
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-white/[0.08] border border-white/10">K</kbd>
          </div>
        </button>
      </div>
    </header>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN SHELL LAYOUT
// ═══════════════════════════════════════════════════════════════════

export function ShellLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const sidebarContext: SidebarContextType = {
    isCollapsed,
    toggleSidebar,
    isMobileOpen,
    setMobileOpen: setIsMobileOpen,
  }

  return (
    <SidebarContext.Provider value={sidebarContext}>
      <div className="flex min-h-screen bg-[#0a0a0f] text-white">
        {/* Skip Link - WCAG Accessibility */}
        <a 
          href="#main-content" 
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-indigo-500 focus:text-white focus:rounded focus:font-ui focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with Breadcrumb */}
          <Header />

          {/* Page Content */}
          <main 
            id="main-content" 
            className="flex-1 overflow-y-auto p-4 lg:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                className="max-w-6xl mx-auto"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
