/**
 * useContrastGuard
 * Menjaga rasio kontras teks terhadap background sesuai WCAG.
 */
import { useEffect, useState } from 'react';
import { getContrastRatio, isWCAGCompliant, WCAGLevel } from '../lib/accessibility';

interface UseContrastGuardOptions {
  backgroundVar?: string;
  foregroundVar?: string;
  fallbackColor?: string;
  level?: WCAGLevel;
}

const readCssVar = (styles: CSSStyleDeclaration, variable: string): string | null => {
  const value = styles.getPropertyValue(variable);
  if (!value) {
    return null;
  }
  return value.trim() || null;
};

export const useContrastGuard = (
  options: UseContrastGuardOptions = {}
): { color: string | null } => {
  const {
    backgroundVar = '--background',
    foregroundVar = '--foreground',
    fallbackColor = '#111827',
    level = WCAGLevel.AA,
  } = options;

  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const evaluate = () => {
      const styles = getComputedStyle(document.documentElement);
      const fg = readCssVar(styles, foregroundVar);
      const bg = readCssVar(styles, backgroundVar) ?? '#ffffff';
      if (!fg) {
        setColor(fallbackColor);
        return;
      }
      const ratio = getContrastRatio(fg, bg);
      setColor(isWCAGCompliant(ratio, level) ? fg : fallbackColor);
    };

    evaluate();

    const handleResize = () => evaluate();
    window.addEventListener('resize', handleResize);

    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

    const handleMediaChange = () => evaluate();
    if (media) {
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', handleMediaChange);
      } else if (typeof media.addListener === 'function') {
        media.addListener(handleMediaChange);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (media) {
        if (typeof media.removeEventListener === 'function') {
          media.removeEventListener('change', handleMediaChange);
        } else if (typeof media.removeListener === 'function') {
          media.removeListener(handleMediaChange);
        }
      }
    };
  }, [backgroundVar, foregroundVar, fallbackColor, level]);

  return { color };
};
