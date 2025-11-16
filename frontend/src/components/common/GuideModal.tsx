/**
 * KLSI 4.0 - GuideModal Component
 * Task Phase 7: Modal untuk menampilkan guide markdown dengan telemetry
 * 
 * Implementasi sesuai Guidelines.md:
 * - Glass-regular untuk modal content
 * - Spring-based animations
 * - Blur & dim backdrop
 * - React Query untuk data fetching
 * - Automatic telemetry tracking
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { useGuide } from '../../hooks/useGuide';
import { LoadingComponent } from './LoadingComponent';
import { VibrantText } from '../ui/VibrantText';
import ReactMarkdown from 'react-markdown';

interface GuideModalProps {
  guideId: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  context?: string;
}

/**
 * GuideModal - Display markdown guides in a modal with telemetry
 */
export const GuideModal: React.FC<GuideModalProps> = ({
  guideId,
  title,
  isOpen,
  onClose,
  locale = 'id-ID',
  context,
}) => {
  const springConfig = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  };

  // Fetch guide content with automatic telemetry tracking
  const {
    data: markdownContent,
    isLoading,
    error,
  } = useGuide({
    guideId,
    locale,
    enabled: isOpen,
    trackOpen: true,
    context,
  });

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Guidelines §1.6 Modal Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springConfig}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={springConfig}
              className="glass-regular rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - FIXED: material-regular untuk avoid glass-on-glass (Guidelines.md §8.5.1) */}
              <div className="sticky top-0 z-10 material-regular border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl">
                    <VibrantText hierarchy="primary" as="span">
                      {title || 'Panduan'}
                    </VibrantText>
                  </h2>
                  <motion.button
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-spring"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={springConfig}
                    aria-label="Tutup"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 max-h-[calc(85vh-80px)]">
                {isLoading ? (
                  <LoadingComponent message="Memuat panduan..." />
                ) : error ? (
                  <div className="material-regular rounded-xl p-6 bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="mb-1">
                          <VibrantText hierarchy="primary" as="span">
                            Gagal Memuat Panduan
                          </VibrantText>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {error.message || 'Terjadi kesalahan saat memuat konten panduan.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : markdownContent ? (
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        // Custom component renderers for better styling
                        h1: ({ children }) => (
                          <h1 className="text-3xl mb-4 mt-8 first:mt-0">
                            <VibrantText hierarchy="primary" as="span">
                              {children}
                            </VibrantText>
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl mb-3 mt-6">
                            <VibrantText hierarchy="primary" as="span">
                              {children}
                            </VibrantText>
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl mb-2 mt-4">
                            <VibrantText hierarchy="primary" as="span">
                              {children}
                            </VibrantText>
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-muted-foreground mb-4 leading-relaxed text-left max-w-[70ch]">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-2">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside text-muted-foreground mb-4 space-y-2">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-muted-foreground">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-secondary px-1.5 py-0.5 rounded text-sm text-foreground">
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-secondary p-4 rounded-lg text-sm text-foreground overflow-x-auto">
                              {children}
                            </code>
                          );
                        },
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {markdownContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Tidak ada konten tersedia
                  </div>
                )}
              </div>

              {/* Footer - FIXED: material-regular untuk avoid glass-on-glass (Guidelines.md §8.5.1) */}
              <div className="sticky bottom-0 z-10 material-regular border-t border-border px-6 py-4">
                <div className="flex justify-end">
                  <motion.button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springConfig}
                  >
                    Tutup
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};