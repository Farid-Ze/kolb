import { Link } from 'react-router-dom'
import { Icon } from '../shared/ui/Icon'

/**
 * AWWWARDS-LEVEL 404 PAGE
 * 
 * Design Principles:
 * - Large typographic impact (like Citrix hero)
 * - Subtle animation on numbers
 * - Clear CTA back to safety
 * - Consistent with brand dark theme
 * - Memorable creative moment
 */

export function NotFoundPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-[8.33%] overflow-hidden">
      {/* Ambient glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
      
      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* 404 Typography - Large Impact */}
        <div 
          className="animate-hero-fade-up opacity-0"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <h1 
            className="font-headline font-bold text-white uppercase tracking-[-0.04em] leading-none select-none"
            style={{ fontSize: 'clamp(8rem, 25vw, 16rem)' }}
          >
            <span className="inline-block hover:text-blue-400 gpu-transition cursor-default">4</span>
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-400 to-gray-600 hover:from-blue-400 hover:via-blue-500 hover:to-blue-600 gpu-transition cursor-default">0</span>
            <span className="inline-block hover:text-blue-400 gpu-transition cursor-default">4</span>
          </h1>
        </div>
        
        {/* Subheading */}
        <div 
          className="animate-hero-fade-up opacity-0 mt-4 sm:mt-6"
          style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}
        >
          <p className="font-ui text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-500">
            Page Not Found
          </p>
        </div>
        
        {/* Description */}
        <div 
          className="animate-hero-fade-up opacity-0 mt-6 sm:mt-8"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          <p className="font-ui text-sm sm:text-base text-gray-400 leading-relaxed max-w-md mx-auto">
            The page you're looking for has drifted into the void. 
            <span className="text-gray-300"> Let's get you back on track.</span>
          </p>
        </div>
        
        {/* CTA - Citrix style scroll indicator adapted */}
        <div 
          className="animate-hero-fade-up opacity-0 mt-10 sm:mt-12"
          style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}
        >
          <Link 
            to="/" 
            className="group inline-flex items-center gap-4 sm:gap-6"
            aria-label="Return to homepage"
          >
            {/* Arrow pointing left (back) */}
            <div className="relative overflow-hidden w-4 h-4 rotate-180">
              <Icon 
                name="arrow-right" 
                size={16} 
                className="text-white group-hover:text-blue-400 gpu-transition group-hover:-translate-x-1 transition-transform duration-300" 
              />
            </div>
            
            {/* Animated Line */}
            <div className="relative w-16 sm:w-24 h-[1px] bg-gray-700 overflow-hidden rotate-180">
              <div 
                className="absolute inset-0 bg-white gpu-layer"
                style={{
                  animation: 'scrollLine 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                }}
              />
            </div>
            
            <span className="font-ui text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white group-hover:text-blue-400 gpu-transition">
              Return Home
            </span>
          </Link>
        </div>
      </div>
      
      {/* Bottom decorative element */}
      <div 
        className="absolute bottom-[calc(100vh/12)] left-[8.33%] animate-hero-fade-up opacity-0"
        style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}
        aria-hidden="true"
      >
        <span className="font-ui text-[9px] uppercase tracking-[0.2em] text-gray-600">
          Error Code: 404
        </span>
      </div>
    </div>
  )
}
