import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../shared/ui/Icon'

/**
 * AWWWARDS-LEVEL ERROR BOUNDARY
 * 
 * Graceful error handling with:
 * - Premium visual design matching 404 page
 * - Clear error messaging
 * - Recovery options
 * - Error reporting capability
 */

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

// Premium error fallback UI
function ErrorFallback({ 
  error, 
  onRetry 
}: { 
  error: Error | null
  onRetry: () => void 
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-[8.33%] overflow-hidden bg-[#080810]">
      {/* Ambient glow - red tinted for error */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
      
      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* Error Icon */}
        <div 
          className="animate-hero-fade-up opacity-0 mb-6"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20">
            <Icon name="alert-triangle" size={40} className="text-red-400" />
          </div>
        </div>
        
        {/* Error Typography */}
        <div 
          className="animate-hero-fade-up opacity-0"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-white uppercase tracking-[-0.02em] mb-2">
            Something Went Wrong
          </h1>
        </div>
        
        {/* Subheading */}
        <div 
          className="animate-hero-fade-up opacity-0 mt-4"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          <p className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-500">
            Application Error
          </p>
        </div>
        
        {/* Description */}
        <div 
          className="animate-hero-fade-up opacity-0 mt-6"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          <p className="font-ui text-sm sm:text-base text-gray-400 leading-relaxed max-w-md mx-auto">
            An unexpected error occurred. 
            <span className="text-gray-300"> Don't worry, your data is safe.</span>
          </p>
          
          {/* Error details (development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-left">
              <summary className="font-ui text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                Technical Details
              </summary>
              <pre className="mt-2 p-4 rounded-lg bg-black/50 border border-white/[0.06] text-xs text-red-400 overflow-auto max-h-32">
                {error.message}
                {'\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        {/* Actions */}
        <div 
          className="animate-hero-fade-up opacity-0 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
        >
          {/* Retry Button */}
          <button
            onClick={onRetry}
            className="group inline-flex items-center gap-3 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] rounded-full gpu-transition"
          >
            <Icon name="refresh-cw" size={16} className="text-white group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
              Try Again
            </span>
          </button>
          
          {/* Home Link - Citrix style */}
          <Link 
            to="/" 
            className="group inline-flex items-center gap-4"
            aria-label="Return to homepage"
          >
            <div className="relative overflow-hidden w-4 h-4 rotate-180">
              <Icon 
                name="arrow-right" 
                size={16} 
                className="text-gray-400 group-hover:text-white gpu-transition" 
              />
            </div>
            <div className="relative w-16 h-[1px] bg-gray-700 overflow-hidden rotate-180">
              <div 
                className="absolute inset-0 bg-white gpu-layer"
                style={{
                  animation: 'scrollLine 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                }}
              />
            </div>
            <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 group-hover:text-white gpu-transition">
              Go Home
            </span>
          </Link>
        </div>
      </div>
      
      {/* Bottom decorative element */}
      <div 
        className="absolute bottom-[calc(100vh/12)] left-[8.33%] animate-hero-fade-up opacity-0"
        style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        aria-hidden="true"
      >
        <span className="font-ui text-[9px] uppercase tracking-[0.2em] text-gray-600">
          Error Boundary
        </span>
      </div>
    </div>
  )
}

export default ErrorBoundary
