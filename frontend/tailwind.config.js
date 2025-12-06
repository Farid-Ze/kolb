/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zenotika: {
          /* Primary Palette - MANDATORY per Design Paradigm */
          primary: '#6366F1', /* Indigo Primary */
          primaryDark: '#4F46E5',
          primaryLight: '#818CF8',
          secondary: '#22D3EE', /* Cyan Secondary */
          secondaryDark: '#06B6D4',
          tertiary: '#A855F7', /* Purple Tertiary */
          tertiaryDark: '#9333EA',
          /* Contextual Colors */
          deepSpace: '#0A0A0F',
          nightIndigo: '#1a1a2e',
          gold: '#D4A853', /* Warm Gold for Sphere */
          frostWhite: '#FAF7F2',
          /* Legacy support */
          secondaryAccent: '#1e293b',
          accent: '#D4A853',
        },
      },
      fontFamily: {
        brand: ['Inter', 'system-ui', 'sans-serif'],
        headline: ['Cormorant Garamond', 'Georgia', 'serif'], /* Elegant serif per Design Paradigm */
        display: ['Cormorant Garamond', 'Georgia', 'serif'], /* Alias for immersive contexts */
        ui: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'], /* Data values, timestamps */
      },
      boxShadow: {
        card: '0 20px 45px -20px rgba(15, 23, 42, 0.65)',
      },
      /**
       * IGLOO.INC-STYLE EASING CURVES
       * Mathematical precision for premium feel
       * Based on: https://easings.net/
       */
      transitionTimingFunction: {
        // Smooth deceleration - ideal for entrances
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        // Snappy with overshoot - buttons/clicks
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Natural spring - cards/modals
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        // Buttery smooth - scrolling/transforms
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        // Premium slow-in - hero animations
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
      },
      animation: {
        // Hero entrance - GPU optimized (transform + opacity only)
        'hero-fade-up': 'heroFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        // Scroll indicator
        'scroll-line': 'scrollLine 2s ease-in-out infinite',
        // Subtle glow pulse
        'glow': 'glowPulse 4s ease-in-out infinite',
        // Ambient particle float (for unified background)
        'float': 'floatDrift 8s ease-in-out infinite',
      },
      keyframes: {
        // Transform + Opacity only = GPU composited
        heroFadeUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translate3d(0, 30px, 0)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translate3d(0, 0, 0)' 
          },
        },
        scrollLine: {
          '0%, 100%': { 
            transform: 'scaleY(0)', 
            transformOrigin: 'top' 
          },
          '50%': { 
            transform: 'scaleY(1)', 
            transformOrigin: 'top' 
          },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
        // Subtle floating motion for ambient particles
        floatDrift: {
          '0%, 100%': { 
            transform: 'translate3d(0, 0, 0)' 
          },
          '25%': { 
            transform: 'translate3d(5px, -10px, 0)' 
          },
          '50%': { 
            transform: 'translate3d(-3px, 5px, 0)' 
          },
          '75%': { 
            transform: 'translate3d(-8px, -5px, 0)' 
          },
        },
      },
    },
  },
  plugins: [],
}
