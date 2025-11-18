/**
 * KLSI 4.0 - useBreakpoint Hook
 * Task TODO2.md Phase 4.4: Detect breakpoint untuk responsive layout
 * 
 * Implementasi sesuai Guidelines.md §1.2:
 * - Form Factor Strategy (mobile, tablet, desktop)
 * - Logical breakpoints bukan device-specific
 * - Responsive layout adaptation
 * 
 * @returns {object} Current breakpoint info
 */

import { useEffect, useState } from 'react';

type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type FormFactor = 'mobile' | 'tablet' | 'desktop';

interface BreakpointInfo {
  /** Current breakpoint size */
  size: BreakpointSize;
  /** Form factor category (mobile/tablet/desktop) */
  formFactor: FormFactor;
  /** Whether screen is mobile-sized (< 768px) */
  isMobile: boolean;
  /** Whether screen is tablet-sized (768px - 1024px) */
  isTablet: boolean;
  /** Whether screen is desktop-sized (>= 1024px) */
  isDesktop: boolean;
  /** Current screen width in pixels */
  width: number;
}

// Breakpoint definitions sesuai tailwind.config.js
const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Determine breakpoint size from window width
 */
const getBreakpointSize = (width: number): BreakpointSize => {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

/**
 * Determine form factor from window width
 * Guidelines.md §1.2.1:
 * - Mobile (Small): Stacked layout, bottom tab bar
 * - Tablet (Medium): Split-view, sidebar emerging
 * - Desktop (Large): Multi-column, persistent sidebar
 */
const getFormFactor = (width: number): FormFactor => {
  if (width >= BREAKPOINTS.lg) return 'desktop';
  if (width >= BREAKPOINTS.md) return 'tablet';
  return 'mobile';
};

/**
 * Hook to detect current breakpoint and form factor
 * 
 * @example
 * const { isMobile, isDesktop, formFactor } = useBreakpoint();
 * 
 * return (
 *   <div className={isMobile ? 'flex-col' : 'flex-row'}>
 *     {isDesktop && <Sidebar />}
 *     <MainContent />
 *   </div>
 * );
 */
export const useBreakpoint = (): BreakpointInfo => {
  const [breakpoint, setBreakpoint] = useState<BreakpointInfo>(() => {
    // Initialize dengan window width jika tersedia
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const size = getBreakpointSize(width);
      const formFactor = getFormFactor(width);

      return {
        size,
        formFactor,
        isMobile: formFactor === 'mobile',
        isTablet: formFactor === 'tablet',
        isDesktop: formFactor === 'desktop',
        width,
      };
    }

    // SSR fallback - assume mobile
    return {
      size: 'sm',
      formFactor: 'mobile',
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      width: 640,
    };
  });

  useEffect(() => {
    // Hanya jalankan di client-side
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const size = getBreakpointSize(width);
      const formFactor = getFormFactor(width);

      setBreakpoint({
        size,
        formFactor,
        isMobile: formFactor === 'mobile',
        isTablet: formFactor === 'tablet',
        isDesktop: formFactor === 'desktop',
        width,
      });
    };

    // Set initial value
    handleResize();

    // Listen untuk resize events
    // Debounce untuk performa
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return breakpoint;
};

/**
 * Hook to check if screen matches specific breakpoint
 * 
 * @param breakpoint - Breakpoint to check against
 * @returns true if current screen matches or exceeds breakpoint
 * 
 * @example
 * const isLargeScreen = useBreakpointMatch('lg');
 */
