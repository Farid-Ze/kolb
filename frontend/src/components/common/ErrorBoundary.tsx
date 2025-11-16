/**
 * KLSI 4.0 - Error Boundary Component
 * Task 81: Buat ErrorBoundary untuk menangkap error React
 * 
 * FIXED: Removed text-* classes, added Motion springs
 * Implementasi sesuai Guidelines.md Section 1.4.3, 2.3.1
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary: Catches React errors and displays fallback UI
 * Implementasi error handling global sesuai best practices
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service (e.g., Sentry)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="glass-regular rounded-xl p-8 max-w-2xl w-full space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            {/* Error Title */}
            <div className="text-center space-y-2">
              <h2 className="text-foreground">
                Terjadi Kesalahan
              </h2>
              <p className="text-muted-foreground">
                Aplikasi mengalami masalah yang tidak terduga. Silakan coba muat ulang halaman.
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="material-thin rounded-lg p-4 space-y-2">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Detail Teknis (Development Mode)
                </summary>
                <pre className="mt-2 text-destructive overflow-auto max-h-48 bg-destructive/5 p-3 rounded">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                whileHover={{ opacity: 0.9, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </motion.button>
              
              <motion.button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                whileHover={{ opacity: 0.9, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Kembali ke Beranda
              </motion.button>
            </div>

            {/* Help Text */}
            <p className="text-center text-muted-foreground">
              Jika masalah berlanjut, silakan hubungi tim dukungan.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorBoundary: Lighter error boundary for individual routes
 * Shows inline error without full-page takeover
 */
export const RouteErrorBoundary: React.FC<Props> = ({
  children,
  fallback,
  onReset,
}) => {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="material-regular rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-foreground">
                Gagal Memuat Konten
              </h3>
            </div>
            <p className="text-muted-foreground">
              Terjadi kesalahan saat memuat konten ini.
            </p>
            <motion.button
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </motion.button>
          </div>
        )
      }
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
};
