/**
 * KLSI 4.0 - ModalLayer Component
 * Task 30: Root modal dengan efek blur & dim pada konten di belakangnya
 * 
 * Implementasi sesuai Guidelines.md:
 * - §1.6: Model Presentasi Kontekstual (Modal)
 * - §2.3.1: Spring-based animations
 * - §8.5.1: Anti-pattern Glass-on-Glass prevention
 */

import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useUIPreferences } from '../../contexts/UIPreferencesContext';
import { X } from 'lucide-react';

interface ModalLayerProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

/**
 * ModalLayer - Root modal component dengan blur & dim backdrop
 * 
 * Bagian 1.6: Sheet/Modal untuk presentasi kontekstual
 * - Menyajikan informasi atau tindakan kontekstual
 * - Backdrop dengan blur & dim effect
 * - Mencegah Glass-on-Glass anti-pattern (§8.5.1)
 * 
 * Bagian 2.3.1: Spring-based entrance/exit animations
 */
export const ModalLayer: React.FC<ModalLayerProps> = ({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnBackdropClick = true,
  showCloseButton = true,
  className = '',
}) => {
  const { reduceMotion, reduceTransparency } = useUIPreferences();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Spring config (Guidelines.md §2.3.1)
  const springConfig = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  };

  // Fallback for reduced motion (Guidelines.md §2.5.2)
  const transition = reduceMotion
    ? { duration: 0.2, ease: 'easeOut' }
    : springConfig;

  // Size variants
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Blur & Dim (Guidelines.md §1.6) */}
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={closeOnBackdropClick ? onClose : undefined}
            style={{
              // Backdrop blur & dim effect (Guidelines.md §1.6)
              backdropFilter: reduceTransparency ? 'none' : 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className={`
                relative
                w-full
                ${sizeClasses[size]}
                pointer-events-auto
                material-thick
                rounded-xl
                ${className}
              `.trim()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={transition}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                  {title && (
                    <h2 className="text-foreground">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      className="
                        rounded-lg 
                        p-2 
                        text-muted-foreground 
                        hover:text-foreground 
                        hover:bg-secondary/50
                        focus-visible:outline-none 
                        focus-visible:ring-2 
                        focus-visible:ring-ring
                      "
                      whileHover={!reduceMotion ? { scale: 1.1 } : undefined}
                      whileTap={!reduceMotion ? { scale: 0.9 } : undefined}
                      transition={springConfig}
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render to portal for proper z-index stacking
  return createPortal(modalContent, document.body);
};

/**
 * useModal - Hook untuk mengelola modal state
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
