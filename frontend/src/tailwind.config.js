/**
 * Tailwind CSS Configuration untuk KOLB-LSI 4.0
 * Implementasi Design System "Liquid Glass" dari Guidelines.md
 *
 * @context $V_{docs}$ - Basis Pengetahuan Desain Antarmuka Modern.md
 * @design_philosophy Hierarki Material, Fisika Optik, Aksesibilitas
 *
 * Prinsip Inti:
 * - Skala Modular: Kelipatan 4 & 8 untuk spacing (y = 8 × n) - Guidelines.md §1.4.1
 * - Material: Dua lapis (Fluid Glass untuk kontrol, Standard untuk konten)
 * - Motion: Berbasis fisika (spring animations)
 * - Color: Semantik + adaptif (light/dark mode)
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Menambahkan path eksplisit untuk file root dan direktori
    './src/App.tsx',
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ===== COLORS: Sistem Semantik + Adaptif =====
      // Sesuai Bagian 3: Warna sebagai Psikofisika Persepsi
      colors: {
        // Sistem warna dasar (dari globals.css) - Guidelines.md §3.3
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        
        // System Colors - Label hierarchy (§3.3.1)
        label: 'var(--color-foreground)',           // Primary labels
        secondaryLabel: 'var(--color-muted-foreground)', // Secondary text
        separator: 'var(--color-border)',           // Dividers & borders
        systemBackground: 'var(--color-background)', // Base background
        
        card: {
          DEFAULT: 'var(--color-card)',
          foreground: 'var(--color-card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--color-popover)',
          foreground: 'var(--color-popover-foreground)',
        },
        
        // Single Accent Color - Untuk interaktivitas (§3.4.1)
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          foreground: 'var(--color-destructive-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',

        // Warna semantik fungsional (Bagian 3.5.1) - dengan high-contrast variants
        success: {
          DEFAULT: '#10b981', // green-500
          foreground: '#ffffff',
          light: '#d1fae5',    // Untuk light mode
          dark: '#065f46',     // Untuk dark mode
          highContrast: '#047857', // High contrast mode
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          foreground: '#ffffff',
          light: '#fef3c7',
          dark: '#78350f',
          highContrast: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444', // red-500
          foreground: '#ffffff',
          light: '#fee2e2',
          dark: '#7f1d1d',
          highContrast: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6', // blue-500
          foreground: '#ffffff',
          light: '#dbeafe',
          dark: '#1e3a8a',
          highContrast: '#2563eb',
        },
      },

      // ===== SPACING: 100% Grid Ritmis 8-point (Bagian 1.4.1) =====
      // y = 8 × n untuk prediktabilitas matematis
      // CRITICAL: Semua spacing adalah kelipatan 4px (0.25rem) atau 8px (0.5rem)
      spacing: {
        '0': '0',
        '0.5': '0.125rem', // 2px - micro spacing (rarely used)
        '1': '0.25rem',    // 4px - half-grid unit (kelipatan 4)
        '2': '0.5rem',     // 8px - BASE GRID UNIT (kelipatan 8) ✓
        '3': '0.75rem',    // 12px - 1.5x base (kelipatan 4)
        '4': '1rem',       // 16px - 2x base (kelipatan 8) ✓
        '5': '1.25rem',    // 20px - 2.5x base (kelipatan 4)
        '6': '1.5rem',     // 24px - 3x base (kelipatan 8) ✓
        '8': '2rem',       // 32px - 4x base (kelipatan 8) ✓
        '10': '2.5rem',    // 40px - 5x base (kelipatan 8) ✓
        '12': '3rem',      // 48px - 6x base (kelipatan 8) ✓
        '16': '4rem',      // 64px - 8x base (kelipatan 8) ✓
        '20': '5rem',      // 80px - 10x base (kelipatan 8) ✓
        '24': '6rem',      // 96px - 12x base (kelipatan 8) ✓
        '32': '8rem',      // 128px - 16x base (kelipatan 8) ✓
        '40': '10rem',     // 160px - 20x base (kelipatan 8) ✓
        '48': '12rem',     // 192px - 24x base (kelipatan 8) ✓
        '56': '14rem',     // 224px - 28x base (kelipatan 8) ✓
        '64': '16rem',     // 256px - 32x base (kelipatan 8) ✓
      },

      // ===== BORDER RADIUS: Fluid Glass (Bagian 4) =====
      borderRadius: {
        none: '0',
        sm: 'var(--radius-sm)', // ~6px
        DEFAULT: 'var(--radius-md)', // ~8px
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)', // ~10px
        xl: 'var(--radius-xl)', // ~14px
        '2xl': '1rem', // 16px
        '3xl': '1.5rem', // 24px
        full: '9999px',
      },

      // ===== BACKDROP BLUR: Material Kaca Fluidik (Bagian 4.2) =====
      // Simulasi fisika optik (refraksi, blur)
      backdropBlur: {
        none: '0',
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // ===== BLUR: Untuk efek lensing =====
      blur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      // ===== OPACITY: Transparansi Material (Bagian 4.3) =====
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1',
        '15': '0.15',
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '85': '0.85',
        '90': '0.9',
        '95': '0.95',
        '100': '1',
      },

      // ===== SHADOWS: Hierarki kedalaman (Z-axis) =====
      boxShadow: {
        // Material standar (Bagian 4.3)
        'material-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        material: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'material-md':
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'material-lg':
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'material-xl':
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

        // Glow untuk interaktivitas (Bagian 2.2.1, 3.5.3)
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        glow: '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 30px rgba(59, 130, 246, 0.5)',
      },

      // ===== ANIMATION: Berbasis Fisika (Bagian 2.3) =====
      // Spring-based untuk Osilasi Harmonik Teredam
      transitionTimingFunction: {
        // Kurva default (fallback untuk reduce-motion)
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',

        // Spring curves (simulasi spring dengan cubic-bezier)
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce
        'spring-gentle': 'cubic-bezier(0.25, 1, 0.5, 1)', // Soft spring
        'spring-smooth': 'cubic-bezier(0.45, 0, 0.55, 1)', // Smooth spring
      },

      // Durasi transisi (Bagian 2.4.1 - Ambang Persepsi)
      transitionDuration: {
        instant: '75ms', // < 100ms = instan
        fast: '150ms', // 100-300ms = responsif
        DEFAULT: '200ms',
        normal: '300ms',
        slow: '500ms',
        slower: '700ms',
      },

      // ===== TYPOGRAPHY: Keterbacaan (Bagian 1.4.3) =====
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },

      // ===== DYNAMIC TYPE: Skala Font Aksesibilitas (Bagian 1.4.3) =====
      // Menggunakan clamp() untuk fluid typography yang responsif dan accessible
      // Formula: clamp(min, preferred, max) dalam rem units
      // Base: 16px = 1rem, scale dengan viewport dan user preferences
      fontSize: {
        // Body text
        xs: ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],     // 12-14px
        sm: ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5' }],        // 14-16px
        base: ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.5' }],        // 16-18px (default)
        lg: ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.5' }],       // 18-20px
        
        // Headings
        xl: ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '1.4' }],        // 20-24px - H4
        '2xl': ['clamp(1.5rem, 1.3rem + 1vw, 1.875rem)', { lineHeight: '1.3' }],       // 24-30px - H3
        '3xl': ['clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)', { lineHeight: '1.2' }],  // 30-36px - H2
        '4xl': ['clamp(2.25rem, 1.9rem + 1.75vw, 3rem)', { lineHeight: '1.1' }],       // 36-48px - H1
        '5xl': ['clamp(3rem, 2.5rem + 2.5vw, 4rem)', { lineHeight: '1' }],             // 48-64px - Hero
        
        // Accessibility sizes (XXXL+)
        '6xl': ['clamp(3.75rem, 3rem + 3.75vw, 5rem)', { lineHeight: '1' }],           // 60-80px
        '7xl': ['clamp(4.5rem, 3.5rem + 5vw, 6rem)', { lineHeight: '1' }],             // 72-96px
        '8xl': ['clamp(6rem, 4.5rem + 7.5vw, 8rem)', { lineHeight: '1' }],             // 96-128px
        '9xl': ['clamp(8rem, 6rem + 10vw, 10rem)', { lineHeight: '1' }],               // 128-160px
      },

      // ===== Z-INDEX: Hierarki Material (Bagian 4.1) =====
      zIndex: {
        base: '0',
        content: '10',
        overlay: '20',
        dropdown: '30',
        modal: '40',
        popover: '50',
        tooltip: '60',
        notification: '70',
      },

      // ===== BREAKPOINTS: Adaptivitas (Bagian 1.2) =====
      screens: {
        xs: '320px', // Mobile kecil
        sm: '640px', // Mobile
        md: '768px', // Tablet
        lg: '1024px', // Desktop kecil
        xl: '1280px', // Desktop
        '2xl': '1536px', // Desktop besar
      },

      // ===== KEYFRAMES: Animasi Custom =====
      keyframes: {
        // Shimmer untuk skeleton loaders (Bagian 2.4.2)
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Pulse untuk notifikasi
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        // Slide untuk transisi (Bagian 2.2.4)
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slide-in-right 300ms spring',
        'slide-in-left': 'slide-in-left 300ms spring',
        'slide-up': 'slide-up 300ms spring',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [
    // Plugin untuk aksesibilitas focus-visible (Bagian 8)
    require('tailwindcss-animate'),
  ],
};