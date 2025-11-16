/**
 * KLSI 4.0 - useReduceTransparency Hook
 * Task TODO2.md Phase 1.9: Detect prefers-reduced-transparency
 * 
 * Implementasi sesuai Guidelines.md §8.5.3:
 * - Mendeteksi user preference untuk reduced transparency
 * - Material glass → opaque solid saat aktif
 * - Menghemat GPU power dan baterai
 * - Aksesibilitas untuk pengguna dengan sensitivitas visual
 * 
 * @returns {boolean} true jika user mengaktifkan reduce transparency
 */

import { useEffect, useState } from 'react';

export const useReduceTransparency = (): boolean => {
  const [reduceTransparency, setReduceTransparency] = useState<boolean>(() => {
    // Initialize dengan media query check
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Hanya jalankan di client-side
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');

    // Handler untuk perubahan preference
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setReduceTransparency(event.matches);
    };

    // Set initial value
    handleChange(mediaQuery);

    // Listen untuk perubahan
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback untuk browser lama
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return reduceTransparency;
};

/**
 * Hook yang return style object untuk material glass
 * Automatically mengganti blur dengan solid background jika reduce transparency aktif
 * 
 * @param glassStyle - Style glass yang diinginkan (opacity, blur)
 * @param fallbackBg - Background color fallback untuk opaque mode
 * @returns Style object yang sudah disesuaikan
 * 
 * @example
 * const glassStyle = useGlassStyle({ opacity: 0.8, blur: 'md' }, 'bg-gray-900');
 */
export const useGlassStyle = (
  glassStyle: { opacity?: number; blur?: string },
  fallbackBg: string = 'bg-background'
) => {
  const reduceTransparency = useReduceTransparency();

  if (reduceTransparency) {
    // Fallback: Solid opaque background
    return {
      className: fallbackBg,
      style: {
        backdropFilter: 'none',
        backgroundColor: 'var(--color-background)',
      },
    };
  }

  // Normal: Glass material dengan blur
  return {
    className: '',
    style: {
      backdropFilter: `blur(${glassStyle.blur || '12px'})`,
      backgroundColor: `rgba(255, 255, 255, ${glassStyle.opacity || 0.1})`,
    },
  };
};
