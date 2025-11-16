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
  const rafIdRef = useRef<number>();

  const handleScroll = useCallback(() => {
    // Cancel previous RAF
    if (rafIdRef.current) {
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
      if (rafIdRef.current) {
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

/**
 * Hook untuk scroll edge detection
 * Alternative API yang return hook instead of render prop
 * 
 * @example
 * const { isScrolled, scrollY } = useScrollEdge({ threshold: 20 });
 * 
 * return (
 *   <nav className={isScrolled ? 'glass-regular' : 'bg-transparent'}>
 *     Navigation
 *   </nav>
 * );
 */
export const useScrollEdge = ({
  threshold = 10,
  targetRef,
}: {
  threshold?: number;
  targetRef?: React.RefObject<HTMLElement>;
} = {}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const rafIdRef = useRef<number>();

  useEffect(() => {
    const handleScroll = () => {
      // Cancel previous RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Schedule update dengan RAF
      rafIdRef.current = requestAnimationFrame(() => {
        const target = targetRef?.current;
        const currentScrollY = target ? target.scrollTop : window.scrollY;

        setScrollY(currentScrollY);
        setIsScrolled(currentScrollY > threshold);
      });
    };

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
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      if (target instanceof Window) {
        target.removeEventListener('scroll', handleScroll);
      } else if (target instanceof HTMLElement) {
        target.removeEventListener('scroll', handleScroll);
      }
    };
  }, [threshold, targetRef]);

  return { isScrolled, scrollY };
};

/**
 * Hook untuk scroll progress (0-1)
 * Useful untuk progress bars atau fade effects
 * 
 * @example
 * const progress = useScrollProgress({ max: 500 });
 * 
 * return (
 *   <div
 *     className="fixed top-0 left-0 h-1 bg-primary"
 *     style={{ width: `${progress * 100}%` }}
 *   />
 * );
 */
export const useScrollProgress = ({
  max = 300,
  targetRef,
}: {
  max?: number;
  targetRef?: React.RefObject<HTMLElement>;
} = {}) => {
  const [progress, setProgress] = useState(0);
  const rafIdRef = useRef<number>();

  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const target = targetRef?.current;
        const scrollY = target ? target.scrollTop : window.scrollY;
        const newProgress = Math.min(scrollY / max, 1);
        setProgress(newProgress);
      });
    };

    const target = targetRef?.current || window;

    handleScroll();

    if (target instanceof Window) {
      target.addEventListener('scroll', handleScroll, { passive: true });
    } else if (target instanceof HTMLElement) {
      target.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      if (target instanceof Window) {
        target.removeEventListener('scroll', handleScroll);
      } else if (target instanceof HTMLElement) {
        target.removeEventListener('scroll', handleScroll);
      }
    };
  }, [max, targetRef]);

  return progress;
};
