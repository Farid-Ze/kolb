/**
 * KLSI 4.0 - ScrollEdgeHandler Component
 * Task TODO2.md Phase 2.9: Deteksi scroll position untuk glass material transition
 * 
 * Implementasi sesuai Guidelines.md §4.5.3:
 * - Scroll-Edge Interaction untuk navigation bars
 * - Transparent saat scrollTop === 0
 * - Apply glass material saat content scroll di bawahnya
 * - Smooth transition untuk kejelasan dan kontras
 * 
 * Justifikasi: Navigation bar transparan saat di atas background kosong,
 * tapi apply glass blur saat konten scroll untuk maintain readability.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';

interface ScrollEdgeHandlerProps {
  /** Scroll threshold untuk trigger glass material (px) */
  threshold?: number;
  /** Callback saat scroll state berubah */
  onScrollStateChange?: (isScrolled: boolean) => void;
  /** Target element untuk detect scroll (default: window) */
  targetRef?: React.RefObject<HTMLElement>;
  /** Children yang akan di-render dengan scroll state */
  children: (isScrolled: boolean, scrollY: number) => React.ReactNode;
}

/**
 * ScrollEdgeHandler - Deteksi scroll position dan provide state ke children
 * 
 * @example
 * // Basic usage
 * <ScrollEdgeHandler threshold={10}>
 *   {(isScrolled) => (
 *     <nav className={isScrolled ? 'glass-regular' : 'bg-transparent'}>
 *       Navigation
 *     </nav>
 *   )}
 * </ScrollEdgeHandler>
 * 
 * @example
 * // With custom scroll target
 * const scrollRef = useRef<HTMLDivElement>(null);
 * 
 * <ScrollEdgeHandler targetRef={scrollRef}>
 *   {(isScrolled, scrollY) => (
 *     <header style={{ opacity: Math.min(scrollY / 100, 1) }}>
 *       Header
 *     </header>
 *   )}
 * </ScrollEdgeHandler>
 */
export const ScrollEdgeHandler: React.FC<ScrollEdgeHandlerProps> = ({
  threshold = 10,
  onScrollStateChange,
  targetRef,
  children,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    // Cancel previous RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule update dengan RAF untuk smooth performance
    rafIdRef.current = requestAnimationFrame(() => {
      const target = targetRef?.current;
      const currentScrollY = target ? target.scrollTop : window.scrollY;

      setScrollY(currentScrollY);

      const shouldBeScrolled = currentScrollY > threshold;
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
        onScrollStateChange?.(shouldBeScrolled);
      }
    });
  }, [threshold, isScrolled, targetRef, onScrollStateChange]);

  useEffect(() => {
    const target = targetRef?.current || window;

    // Set initial value
    handleScroll();

    // Add scroll listener
    if (target instanceof Window) {
      target.addEventListener('scroll', handleScroll, { passive: true });
    } else if (target instanceof HTMLElement) {
      target.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Cleanup
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      if (target instanceof Window) {
        target.removeEventListener('scroll', handleScroll);
      } else if (target instanceof HTMLElement) {
        target.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll, targetRef]);

  return <>{children(isScrolled, scrollY)}</>;
};

