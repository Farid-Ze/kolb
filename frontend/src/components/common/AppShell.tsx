/**
 * KLSI 4.0 - AppShell Component
 * Task TODO2.md Phase 4.3: Form Factor Strategy (mobile/tablet/desktop)
 * 
 * Implementasi sesuai Guidelines.md:
 * §1.2.1: Strategi Form Factor
 *   - Mobile (Small): Prioritas ergonomi, tumpukan (stacked), tab di bawah
 *   - Tablet (Medium): Split-view, sidebar, grid multi-kolom
 *   - Desktop (Large): Panel multi-kolom, sidebar persisten, inspector
 * §4.2: Material Kaca Fluidik untuk navigation layer
 * §1.3.2: Zona Hijau ergonomis untuk mobile
 */

import React, { useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Menu,
  X,
  LogOut,
  Users,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { useAuth } from '../../contexts/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { VibrantText } from '../ui/VibrantText';
import { useScrollEdge } from '../ui/scrollEdgeHooks';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { TelemetryConsentBanner } from './TelemetryConsentBanner';
import { useNonBlockingNavigate } from '../../hooks/useNonBlockingNavigate';

interface AppShellProps {
  children: ReactNode;
  showSidebar?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: 'STUDENT' | 'MEDIATOR';
}

const navigationItems: NavItem[] = [
  { label: 'Beranda', path: '/', icon: LayoutDashboard },
  { label: 'Mulai Asesmen', path: '/assessment/start', icon: FileText },
  { label: 'Laporan Saya', path: '/reports/self', icon: BookOpen },
  { label: 'Kelola Tim', path: '/teams', icon: Users, requiredRole: 'MEDIATOR' },
  { label: 'Penelitian', path: '/research', icon: LogOut, requiredRole: 'MEDIATOR' },
];

/**
 * AppShell: Layout wrapper dengan Liquid Glass Header & Sidebar
 * Bagian 4.2.1 & 4.2.3 - Navigation layer menggunakan Material Kaca Fluidik
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  showSidebar = true,
}) => {
  const navigate = useNonBlockingNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll-edge detection (Guidelines.md §4.5.3)
  // Header transparan saat scrollTop === 0, apply glass saat scrolled
  const { isScrolled } = useScrollEdge({ threshold: 20 });

  const handleLogout = () => {
    logout();
    void navigate('/auth/login');
  };

  const filteredNavItems = navigationItems.filter(
    (item) => !item.requiredRole || item.requiredRole === user?.role
  );

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const breakpoint = useBreakpoint();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header dengan Liquid Glass Material (Guidelines.md §4.2 - Navigation Layer, §8.2.1) */}
      <header className={cn(
        'glass-regular sticky top-0 z-50 border-b border-border/50',
        isScrolled && 'bg-background/95 backdrop-blur-sm'
      )}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          {/* Logo & Brand - 8px grid spacing (Bagian 1.4.1) */}
          <div className="flex items-center gap-3">
            {/* Guidelines.md §1.2.1: Mobile shows hamburger, Desktop shows persistent nav */}
            {showSidebar && breakpoint.isMobile && (
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-secondary/50"
                aria-label="Toggle mobile menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.button>
            )}

            <motion.button
              onClick={() => {
                void navigate('/');
              }}
              className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-2 -m-2 transition-spring"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* FIXED §3.4.2: Logo sebagai identitas, bukan interaktif signifier */}
              <h1>
                <VibrantText hierarchy="primary" as="span">
                  KLSI 4.0
                </VibrantText>
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Learning Style Inventory
              </p>
            </motion.button>
          </div>

          {/* Desktop Navigation (Tablet & Above) - Motion spring (Bagian 2.3.1) */}
          {showSidebar && (
            <div className="hidden md:flex items-center gap-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => {
                      void navigate(item.path);
                    }}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* User Actions - 8px grid spacing */}
          <div className="flex items-center gap-3">
            {/* User Info (Desktop) */}
            <div className="hidden lg:block text-right px-3">
              <VibrantText hierarchy="primary" as="p">
                {user?.name || 'Pengguna'}
              </VibrantText>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            {/* Theme Toggle (Task 82) */}
            <ThemeToggle />

            {/* Logout Button - Motion spring */}
            <motion.button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Logout"
              whileHover={{ scale: 1.03, opacity: 0.9 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </motion.button>
          </div>
        </nav>

        {/* Mobile Navigation Menu (Bagian 1.2.1 - Mobile Strategy) */}
        <AnimatePresence>
          {showSidebar && isMobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="px-4 py-4 space-y-2">
                {/* User Info Mobile - 8px grid */}
                <div className="px-4 py-3 mb-2 rounded-xl bg-secondary/30">
                  <VibrantText hierarchy="primary" as="p">
                    {user?.name || 'Pengguna'}
                  </VibrantText>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

                {/* Navigation Links - Motion spring */}
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);

                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => {
                        void navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area - 8px grid spacing (Bagian 1.4.1) */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 space-y-6">
        <TelemetryConsentBanner />
        {children}
      </main>

      {/* Footer (Optional) - 8px grid spacing */}
      <footer className="border-t border-border/50 mt-16">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">
              © 2024 KLSI 4.0 - Learning Style Inventory
            </p>
            <p className="text-xs text-muted-foreground text-center md:text-right">
              Instrumen formatif untuk refleksi belajar, bukan diagnostik klinis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};