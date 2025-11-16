/**
 * KLSI 4.0 - AuthLayout Component
 * Task 35: Layout untuk halaman autentikasi (Login/Register)
 * 
 * Implementasi sesuai frontend_blueprint.md §3.2:
 * - Centered content layout
 * - Minimal chrome untuk fokus pada form
 * - Gradient background (Guidelines.md)
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useUIPreferences } from '../../contexts/UIPreferencesContext';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

/**
 * AuthLayout - Layout untuk halaman authentication
 * 
 * Centered, minimal layout dengan gradient background
 * Sesuai Guidelines.md §1.2 & frontend_blueprint.md §3.2
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
}) => {
  const { reduceMotion } = useUIPreferences();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 auth-gradient">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0.2, ease: 'easeOut' }
            : { type: 'spring', stiffness: 300, damping: 25 }
        }
      >
        {/* Logo/Brand */}
        {showLogo && (
          <div className="text-center mb-8">
            <h1 className="text-foreground mb-2">
              KLSI 4.0
            </h1>
            <p className="text-muted-foreground">
              Kolb Learning Style Inventory
            </p>
          </div>
        )}

        {/* Title & Subtitle */}
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h2 className="text-foreground mb-2">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Content (Form) */}
        <div className="material-thick rounded-xl p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
