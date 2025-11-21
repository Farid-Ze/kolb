import { useEffect, useRef, useState } from 'react';

interface ScrollHookOptions {
  threshold?: number;
  targetRef?: React.RefObject<HTMLElement>;
}

interface ScrollProgressOptions {
  max?: number;
  targetRef?: React.RefObject<HTMLElement>;
}

export const useScrollEdge = ({
  threshold = 10,
  targetRef,
}: ScrollHookOptions = {}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const target = targetRef?.current;
        const currentScrollY = target ? target.scrollTop : window.scrollY;

        setScrollY(currentScrollY);
        setIsScrolled(currentScrollY > threshold);
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
      if (rafIdRef.current !== null) {
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

export const useScrollProgress = ({
  max = 300,
  targetRef,
}: ScrollProgressOptions = {}) => {
  const [progress, setProgress] = useState(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current !== null) {
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
      if (rafIdRef.current !== null) {
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
