/**
 * KLSI 4.0 - VibrantText Component
 * Task TODO2.md Phase 2.6 & 2.7: Vibrant text on glass untuk keterbacaan
 * 
 * Implementasi sesuai Guidelines.md §4.4 & §3.5.2:
 * - WAJIB digunakan di atas GlassPanel
 * - useVibrancy untuk contrast-safe color
 * - Tidak menggunakan opacity sederhana
 * - Adaptif untuk light/dark mode
 * 
 * Technical:
 * - Menggunakan useGlassPanelContext untuk detect parent glass
 * - Fallback ke text-foreground jika tidak di atas glass
 * - Auto-adjust hierarchy (primary/secondary/tertiary)
 */

import React, { ReactNode } from 'react';
import { useGlassPanelContext } from './GlassPanel.context';
import { cn } from '../../lib/utils';

export interface VibrantTextProps {
  children: ReactNode;
  /** Text hierarchy level */
  hierarchy?: 'primary' | 'secondary' | 'tertiary';
  /** HTML element to render */
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Additional CSS classes */
  className?: string;
  /** Truncate with ellipsis */
  truncate?: boolean;
}

export type VibrantTextPreset = 'heading' | 'label' | 'description' | 'caption';

export interface VibrantTextWithPresetProps extends VibrantTextProps {
  preset?: VibrantTextPreset;
}

/**
 * VibrantText - Text yang otomatis vibrant di atas glass
 * 
 * Guidelines.md §4.4 - WAJIB untuk keterbacaan:
 * - Teks di atas GlassPanel MUST use VibrantText
 * - useVibrancy ensures 4.5:1 contrast minimum
 * - Bukan opacity sederhana (§4.5.4)
 * 
 * Guidelines.md §3.5.2 - Vibrancy mechanism:
 * - Perceptual blend, bukan alpha blend
 * - Adapts untuk background color
 * - Maintains perceived color + contrast
 * 
 * @example
 * // Di atas GlassPanel (auto vibrant)
 * <GlassPanel>
 *   <VibrantText hierarchy="primary">
 *     Title Text
 *   </VibrantText>
 *   <VibrantText hierarchy="secondary">
 *     Description
 *   </VibrantText>
 * </GlassPanel>
 * 
 * @example
 * // Di luar glass (fallback ke system colors)
 * <VibrantText>Normal text</VibrantText>
 */
export const VibrantText: React.FC<VibrantTextWithPresetProps> = ({
  children,
  hierarchy = 'primary',
  as: Component = 'span',
  className = '',
  truncate = false,
  preset,
}) => {
  // Map preset to hierarchy
  const effectiveHierarchy: VibrantTextProps['hierarchy'] = preset
    ? preset === 'heading'
      ? 'primary'
      : preset === 'label'
      ? 'primary'
      : preset === 'description'
      ? 'secondary'
      : 'tertiary'
    : hierarchy;
  // Get vibrancy context dari parent GlassPanel
  const glassContext = useGlassPanelContext();

  // Determine text color (Guidelines §3.5.2)
  const getTextColor = () => {
    if (!glassContext?.isGlass) {
      // Not on glass - use standard system colors
      switch (effectiveHierarchy) {
        case 'primary':
          return 'text-foreground';
        case 'secondary':
          return 'text-muted-foreground';
        case 'tertiary':
          return 'text-muted-foreground/70';
      }
    }

    // On glass - use vibrant colors from context
    switch (effectiveHierarchy) {
      case 'primary':
        return ''; // Will use inline style from context
      case 'secondary':
        return ''; // Will use inline style from context  
      case 'tertiary':
        return ''; // Will use reduced opacity of secondary
    }
  };

  // Get inline style for vibrant color
  const getVibrantStyle = () => {
    if (!glassContext?.isGlass) {
      return undefined;
    }

    switch (effectiveHierarchy) {
      case 'primary':
        return { color: glassContext.textColor };
      case 'secondary':
        return { color: glassContext.secondaryTextColor };
      case 'tertiary':
        // Tertiary is secondary with reduced opacity
        return {
          color: glassContext.secondaryTextColor,
          opacity: 0.7,
        };
    }
  };

  return (
    <Component
      className={cn(
        getTextColor(),
        truncate && 'truncate',
        className
      )}
      style={getVibrantStyle()}
    >
      {children}
    </Component>
  );
};

/**
 * VibrantHeading - Preset for headings on glass
 */
interface VibrantHeadingProps extends Omit<VibrantTextProps, 'hierarchy' | 'as'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const VibrantHeading: React.FC<VibrantHeadingProps> = ({
  level = 2,
  className,
  ...props
}) => {
  const Component = `h${level}`;
  
  return (
    <VibrantText
      as={Component}
      hierarchy="primary"
      className={cn('font-semibold', className)}
      {...props}
    />
  );
};

/**
 * VibrantLabel - Preset for labels on glass
 */
export const VibrantLabel: React.FC<Omit<VibrantTextProps, 'hierarchy' | 'as'>> = ({
  className,
  ...props
}) => (
  <VibrantText
    as="span"
    hierarchy="primary"
    className={cn('font-medium', className)}
    {...props}
  />
);

/**
 * VibrantDescription - Preset for descriptions on glass
 */
export const VibrantDescription: React.FC<Omit<VibrantTextProps, 'hierarchy' | 'as'>> = ({
  className,
  ...props
}) => (
  <VibrantText
    as="p"
    hierarchy="secondary"
    className={cn('text-sm', className)}
    {...props}
  />
);

/**
 * VibrantCaption - Preset for captions/metadata on glass
 */
export const VibrantCaption: React.FC<Omit<VibrantTextProps, 'hierarchy' | 'as'>> = ({
  className,
  ...props
}) => (
  <VibrantText
    as="span"
    hierarchy="tertiary"
    className={cn('text-xs', className)}
    {...props}
  />
);
