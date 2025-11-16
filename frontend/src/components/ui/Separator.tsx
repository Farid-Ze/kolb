/**
 * KLSI 4.0 - Separator Component
 * Task TODO2.md Phase 5.8: Separator dengan system color token
 * 
 * Implementasi sesuai Guidelines.md §1.5:
 * - Gunakan token warna separator sistem
 * - Bukan gray-200 hard-coded
 * - Adapts untuk light/dark mode otomatis
 * - Subtle untuk tidak overpower content
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SeparatorProps {
  /** Orientation of separator */
  orientation?: 'horizontal' | 'vertical';
  /** Thickness variant */
  thickness?: 'thin' | 'regular' | 'thick';
  /** Apply spacing around separator */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Decorative role (default true for accessibility) */
  decorative?: boolean;
}

/**
 * Separator - Pemisah visual menggunakan system color token
 * 
 * Guidelines.md §1.5:
 * - Gunakan sparingly - spasi seringkali pemisah lebih baik
 * - Untuk memisah list items atau functional areas
 * - MUST use separator system token, bukan hardcoded color
 * 
 * @example
 * // Basic horizontal separator
 * <Separator />
 * 
 * @example
 * // Vertical separator dalam flex row
 * <div className="flex items-center gap-4">
 *   <span>Item 1</span>
 *   <Separator orientation="vertical" />
 *   <span>Item 2</span>
 * </div>
 * 
 * @example
 * // Section divider dengan spacing
 * <Separator spacing="lg" />
 */
export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  thickness = 'regular',
  spacing = 'none',
  className = '',
  decorative = true,
}) => {
  // Guidelines §1.4.1: 8-point grid spacing
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'my-2' : 'mx-2', // 8px
    md: orientation === 'horizontal' ? 'my-4' : 'mx-4', // 16px
    lg: orientation === 'horizontal' ? 'my-6' : 'mx-6', // 24px
  };

  // Thickness variants (subtle by default)
  const thicknessClasses = {
    thin: orientation === 'horizontal' ? 'h-px' : 'w-px',
    regular: orientation === 'horizontal' ? 'h-[1px]' : 'w-[1px]',
    thick: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5', // 2px
  };

  // Orientation base classes
  const orientationClasses =
    orientation === 'horizontal' ? 'w-full' : 'h-full self-stretch';

  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        // System separator color token (adapts light/dark automatically)
        'bg-border shrink-0',
        orientationClasses,
        thicknessClasses[thickness],
        spacingClasses[spacing],
        className
      )}
    />
  );
};

/**
 * SectionSeparator - Heavier separator untuk major sections
 * 
 * @example
 * <SectionSeparator />
 */
export const SectionSeparator: React.FC<Omit<SeparatorProps, 'thickness'>> = (props) => (
  <Separator thickness="thick" spacing="lg" {...props} />
);

/**
 * InlineSeparator - Subtle separator untuk inline elements
 * 
 * @example
 * <div className="flex items-center">
 *   <span>Tags:</span>
 *   <InlineSeparator orientation="vertical" />
 *   <span>React</span>
 * </div>
 */
export const InlineSeparator: React.FC<Omit<SeparatorProps, 'thickness' | 'spacing'>> = (
  props
) => <Separator thickness="thin" spacing="sm" {...props} />;
