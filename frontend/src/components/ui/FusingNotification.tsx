/**
 * KLSI 4.0 - FusingNotification Component
 * Task TODO2.md Phase 3.14: PoC untuk Fusing effect
 * 
 * Implementasi sesuai Guidelines.md §2.3.2:
 * - Fusing: Dua elemen bergabung seperti tetesan air
 * - Menggunakan filter: blur() + contrast() trick
 * - Menunjukkan hubungan kontekstual
 * - Advanced fluid motion
 * 
 * Technical approach:
 * - Parent container dengan backdrop-filter: contrast()
 * - Child elements dengan filter: blur()
 * - Saat berdekatan, blur + contrast = fusing effect
 * - Spring-based position animations
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { SPRING_SMOOTH } from '../../lib/motion';
import { X, Bell, MessageCircle, Mail } from 'lucide-react';

interface Notification {
  id: string;
  type: 'bell' | 'message' | 'mail';
  content: string;
  timestamp: Date;
}

interface FusingNotificationProps {
  /** List of notifications */
  notifications: Notification[];
  /** Callback when notification dismissed */
  onDismiss?: (id: string) => void;
  /** Enable fusing effect */
  enableFusing?: boolean;
  className?: string;
}

/**
 * FusingNotification - PoC untuk fusing effect
 * 
 * Guidelines.md §2.3.2 - Sifat Fluidik:
 * - Fusing: Elemen berdekatan bergabung seperti liquid
 * - Menunjukkan hubungan kontekstual
 * - CSS trick: blur + contrast
 * 
 * How it works:
 * 1. Parent: backdrop-filter: contrast(20)
 * 2. Children: filter: blur(10px)
 * 3. When close: blur + contrast = merge visual
 * 4. Physics: spring animations untuk natural motion
 * 
 * @example
 * const [notifications, setNotifications] = useState([...]);
 * 
 * <FusingNotification
 *   notifications={notifications}
 *   onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
 *   enableFusing
 * />
 */
export const FusingNotification: React.FC<FusingNotificationProps> = ({
  notifications,
  onDismiss,
  enableFusing = true,
  className = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getIcon = (type: Notification['type']) => {
    const iconClasses = 'h-5 w-5';
    switch (type) {
      case 'bell':
        return <Bell className={iconClasses} />;
      case 'message':
        return <MessageCircle className={iconClasses} />;
      case 'mail':
        return <Mail className={iconClasses} />;
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* 
        Fusing container (Guidelines §2.3.2)
        Contrast filter + blur on children = fusing effect
      */}
      <div
        className={cn(
          'space-y-2',
          // CRITICAL: High contrast + child blur = fusing
          enableFusing && 'fusing-container'
        )}
        style={
          enableFusing
            ? {
                // Backdrop contrast amplifies blur effect
                backdropFilter: 'contrast(20)',
                WebkitBackdropFilter: 'contrast(20)',
              }
            : undefined
        }
      >
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: 100,
                transition: { duration: 0.2 },
              }}
              transition={SPRING_SMOOTH}
              onHoverStart={() => setHoveredId(notification.id)}
              onHoverEnd={() => setHoveredId(null)}
              className={cn(
                'relative',
                // Blur for fusing (only when fusing enabled)
                enableFusing && 'fusing-element'
              )}
              style={
                enableFusing
                  ? {
                      // Blur makes elements "soft" so they can fuse
                      filter: 'blur(1px)',
                      // When hovered, reduce blur to show detail
                      ...(hoveredId === notification.id && {
                        filter: 'blur(0px)',
                        zIndex: 10,
                      }),
                    }
                  : undefined
              }
            >
              <div
                className={cn(
                  'glass-regular rounded-xl p-4 border border-border/50',
                  'transition-all duration-300',
                  hoveredId === notification.id && 'shadow-lg'
                )}
              >
                {/* Content */}
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {getIcon(notification.type)}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={() => onDismiss?.(notification.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Info panel */}
      {enableFusing && notifications.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
        >
          <p className="text-xs text-muted-foreground">
            <strong>Fusing Effect Active:</strong> Notifications akan "bergabung" seperti
            liquid saat berdekatan. Hover untuk melihat detail.
          </p>
        </motion.div>
      )}
    </div>
  );
};

/**
 * Demo component untuk showcase fusing
 */
export const FusingNotificationDemo: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'bell',
      content: 'New assessment completed',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      type: 'message',
      content: 'Team member commented on report',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: '3',
      type: 'mail',
      content: 'Weekly summary email sent',
      timestamp: new Date(Date.now() - 180000),
    },
  ]);

  const [enableFusing, setEnableFusing] = useState(true);

  const addNotification = () => {
    const types: Notification['type'][] = ['bell', 'message', 'mail'];
    const newNotification: Notification = {
      id: Date.now().toString(),
      type: types[Math.floor(Math.random() * types.length)],
      content: `Notification #${notifications.length + 1}`,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6 max-w-md">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 glass-regular rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-foreground">Fusing Effect</h3>
          <p className="text-xs text-muted-foreground">
            Guidelines.md §2.3.2 - Liquid behavior
          </p>
        </div>
        <button
          onClick={() => setEnableFusing(!enableFusing)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            enableFusing
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          {enableFusing ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Add notification button */}
      <button
        onClick={addNotification}
        className="w-full px-4 py-3 glass-regular rounded-lg text-sm font-medium text-foreground hover:glass-thick transition-all"
      >
        Add Notification
      </button>

      {/* Notifications */}
      <FusingNotification
        notifications={notifications}
        onDismiss={handleDismiss}
        enableFusing={enableFusing}
      />
    </div>
  );
};

/**
 * CSS for fusing effect (add to globals.css)
 * 
 * .fusing-container {
 *   isolation: isolate;
 * }
 * 
 * .fusing-element {
 *   mix-blend-mode: multiply;
 * }
 */
