/**
 * KLSI 4.0 - useWindowFocus Hook
 * Task TODO2.md Phase 5.11: Desktop window focus state
 * 
 * Per Guidelines.md §8.5.4:
 * "Pada OS desktop, material sering berperilaku berbeda saat jendela aktif (fokus) 
 * vs. tidak aktif (di latar belakang)."
 * 
 * Hook ini mendeteksi status fokus window/tab dan menyediakan
 * state untuk adaptasi visual material sesuai Guidelines.
 */

import { useState, useEffect } from 'react';

interface WindowFocusState {
  /** True jika window/tab saat ini memiliki fokus */
  isFocused: boolean;
  
  /** True jika window visible (not minimized/hidden) */
  isVisible: boolean;
}

/**
 * Hook untuk mendeteksi window focus state
 * Menggunakan Page Visibility API dan focus events
 * 
 * Usage:
 * ```tsx
 * const { isFocused, isVisible } = useWindowFocus();
 * 
 * <GlassPanel 
 *   className={cn(
 *     "glass-regular",
 *     !isFocused && "opacity-90 saturate-50"
 *   )}
 * />
 * ```
 */
export function useWindowFocus(): WindowFocusState {
  const [isFocused, setIsFocused] = useState(() => {
    // Initial state: assume focused on mount
    if (typeof document !== 'undefined') {
      return document.hasFocus();
    }
    return true;
  });

  const [isVisible, setIsVisible] = useState(() => {
    // Initial state: check Page Visibility API
    if (typeof document !== 'undefined') {
      return document.visibilityState === 'visible';
    }
    return true;
  });

  useEffect(() => {
    // Handler untuk window focus events
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    // Handler untuk Page Visibility API
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    // Listen to focus/blur events
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // Listen to visibility changes (tab switching, minimizing)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isFocused, isVisible };
}

/**
 * Helper function: Get CSS classes for window focus state
 * 
 * Per Guidelines §8.5.4:
 * "Material menjadi kurang jenuh atau sedikit lebih buram saat tidak aktif"
 */
export function getWindowFocusClasses(isFocused: boolean): string {
  if (isFocused) {
    return '';
  }
  
  // Inactive state: reduce saturation and slightly increase opacity
  // This creates visual hierarchy between active and inactive windows
  return 'saturate-75 brightness-95 transition-all duration-300';
}
