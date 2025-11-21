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
import { useUIPreferencesOptional } from '../contexts/useUIPreferences';

export const useReduceTransparency = (): boolean => {
  const context = useUIPreferencesOptional();
  const [systemPreference, setSystemPreference] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window
        .matchMedia('(prefers-reduced-transparency: reduce)')
        .matches;
    }
    return false;
  });
  const [attributePreference, setAttributePreference] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return (
        document.documentElement.getAttribute('data-reduce-transparency') ===
        'true'
      );
    }
    return false;
  });

  useEffect(() => {
    // Hanya jalankan di client-side
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');

    // Handler untuk perubahan preference
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setSystemPreference(event.matches);
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

  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const updateFromAttribute = () => {
      setAttributePreference(
        root.getAttribute('data-reduce-transparency') === 'true'
      );
    };

    updateFromAttribute();
    const observer = new MutationObserver(updateFromAttribute);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-reduce-transparency'],
    });

    return () => observer.disconnect();
  }, []);

  const effectivePreference =
    attributePreference || systemPreference;

  if (context) {
    return context.reduceTransparency || effectivePreference;
  }

  return effectivePreference;
};
