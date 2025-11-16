/**
 * KLSI 4.0 - useReduceMotion Hook
 * Task TODO2.md Phase 1.8: Detect prefers-reduced-motion
 * 
 * Implementasi sesuai Guidelines.md §2.5:
 * - Mendeteksi user preference untuk reduced motion
 * - Digunakan untuk fallback animasi (spring → cross-fade)
 * - Mendukung aksesibilitas untuk sensitivitas vestibular
 * 
 * @returns {boolean} true jika user mengaktifkan reduce motion
 */

import { useEffect, useState } from 'react';

export const useReduceMotion = (): boolean => {
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    // Initialize dengan media query check
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Hanya jalankan di client-side
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Handler untuk perubahan preference
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setReduceMotion(event.matches);
    };

    // Set initial value
    handleChange(mediaQuery);

    // Listen untuk perubahan
    // Safari < 14 menggunakan addListener, modern browsers menggunakan addEventListener
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

  return reduceMotion;
};

/**
 * Hook alternatif yang return transition config untuk framer-motion
 * Automatically mengganti spring dengan cross-fade jika reduce motion aktif
 * 
 * @example
 * const transition = useMotionTransition();
 * <motion.div transition={transition} />
 */
export const useMotionTransition = () => {
  const reduceMotion = useReduceMotion();

  if (reduceMotion) {
    // Fallback: Simple cross-fade (opacity transition)
    return {
      duration: 0.2,
      ease: 'easeInOut',
    };
  }

  // Default: Spring physics
  return {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  };
};
