/**
 * KLSI 4.0 - SplitViewLayout Component
 * Task 37: Layout untuk Mediator dashboard dengan sidebar
 * 
 * Implementasi sesuai frontend_blueprint.md §3.2:
 * - Two-column layout untuk desktop
 * - Collapsible sidebar untuk mobile
 * - Master-detail pattern
 */

import React, { ReactNode, useState } from 'react';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIPreferences } from '../../contexts/useUIPreferences';
import { cn } from '../ui/utils';

interface SplitViewLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarTitle?: string;
  defaultSidebarOpen?: boolean;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * SplitViewLayout - Master-detail layout untuk Mediator
 * 
 * Sesuai Guidelines.md §1.2 & frontend_blueprint.md §3.2
 * - Responsive: sidebar collapses pada mobile
 * - Glass material untuk sidebar (§4.2)
 * - Smooth transitions (§2.3.1)
 */
export const SplitViewLayout: React.FC<SplitViewLayoutProps> = ({
  sidebar,
  children,
  sidebarTitle,
  defaultSidebarOpen = true,
  sidebarWidth = 'md',
  className = '',
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);
  const { reduceMotion } = useUIPreferences();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Width classes
  const widthClasses = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
  };

  const sidebarWidthClass = widthClasses[sidebarWidth];

  return (
    <div className={`min-h-screen bg-background flex ${className}`.trim()}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            className={cn(
              'fixed lg:sticky top-0 left-0 h-screen z-50',
              'glass-regular border-r border-border',
              'overflow-y-auto',
              sidebarWidthClass
            )}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={
              reduceMotion
                ? { duration: 0.2, ease: 'easeOut' }
                : { type: 'spring', stiffness: 300, damping: 30 }
            }
          >
            {/* Sidebar Header */}
            <div className="sticky top-0 glass-regular border-b border-border p-4 flex items-center justify-between">
              {sidebarTitle && (
                <h2 className="text-foreground">{sidebarTitle}</h2>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="p-4">{sidebar}</div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Menu Button */}
        {!isSidebarOpen && (
          <div className="lg:hidden sticky top-0 z-30 glass-regular border-b border-border p-4">
            <Button variant="ghost" size="sm" onClick={toggleSidebar}>
              <Menu className="h-5 w-5 mr-2" />
              Menu
            </Button>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
