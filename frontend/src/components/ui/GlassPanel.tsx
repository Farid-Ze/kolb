/**
 * KLSI 4.0 - GlassPanel Component
 * Task TODO2.md Phase 2.1-2.4: Material Kaca Fluidik dengan variants & accessibility
 * Phase 5.6: COMPLETED - Integrate useVibrancy untuk vibrant text on glass
 * 
 * Implementasi sesuai Guidelines.md:
 * §4.2: Material Kaca Fluidik untuk navigation & control layer
 * §4.3: Material Standar untuk content layer
 * §4.4: VibrantText wajib di atas glass untuk keterbacaan
 * §4.2.5: Varian Clear dengan dimming layer wajib
 * §8.5.3: Fallback aksesibilitas untuk prefers-reduced-transparency
 * §8.5.2: Anti-pattern mitigation untuk Clear glass
 */

import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { useReduceTransparency } from '../../hooks/useReduceTransparency';
import { useVibrancy } from '../../hooks/useVibrancy';
import { useWindowFocus } from '../../hooks/useWindowFocus';
import { cn } from '../../lib/utils';

// Context untuk vibrancy information
interface GlassPanelContextValue {
  isGlass: boolean;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  contrastRatio: number;
}

const GlassPanelContext = createContext<GlassPanelContextValue | null>(null);

/**
 * Hook untuk mendapatkan vibrancy info dari parent GlassPanel
 * Digunakan oleh VibrantText component
 */
export const useGlassPanelContext = () => useContext(GlassPanelContext);

export interface GlassPanelProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Material type: functional (navigation/control) atau content (data layer) */
  material?: 'functional' | 'content';
  /** Variant of glass material */
  variant?: 'regular' | 'clear' | 'thick' | 'thin';
  /** Density controls internal padding */
  density?: 'compact' | 'regular' | 'spacious' | 'thin' | 'ultra-thin';
  /** Emphasis level (deprecated, use variant instead) */
  emphasis?: 'low' | 'medium' | 'high';
  /** Apply dimming layer (required for clear variant) */
  withDimming?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'button';
}

/**
 * GlassPanel - Komponen Liquid Glass utama
 * 
 * Material Hierarchy (Guidelines.md §4):
 * - functional: Kaca Fluidik (navigation bars, toolbars, modals)
 * - content: Material Standar (cards, lists, panels)
 * 
 * Variants:
 * - regular: Default balanced blur & opacity
 * - clear: High transparency (WAJIB dengan dimming untuk kontras)
 * - thick: Heavier opacity untuk hover/active states
 * - thin: Subtle material untuk content layer
 * 
 * @example
 * // Navigation bar (functional glass)
 * <GlassPanel material="functional" variant="regular">
 *   <nav>Menu</nav>
 * </GlassPanel>
 * 
 * @example
 * // Clear glass over media (MUST use withDimming)
 * <GlassPanel material="functional" variant="clear" withDimming>
 *   <div>Overlay content</div>
 * </GlassPanel>
 * 
 * @example
 * // Content card
 * <GlassPanel material="content" variant="regular">
 *   <article>Card content</article>
 * </GlassPanel>
 */
export const GlassPanel = React.forwardRef<HTMLElement, GlassPanelProps>(({
  children,
  material = 'functional',
  variant = 'regular',
  density = 'regular',
  emphasis, // Deprecated but kept for backward compatibility
  withDimming = false,
  className = '',
  as: Component = 'div',
  style,
  ...rest
}, ref) => {
  const reduceTransparency = useReduceTransparency();
  const { isFocused } = useWindowFocus();

  // Map deprecated emphasis to variant for backward compatibility
  const effectiveVariant = emphasis
    ? emphasis === 'low'
      ? 'clear'
      : emphasis === 'high'
      ? 'thick'
      : 'regular'
    : variant;

  // Guidelines.md §4.2 & §4.3: Material class selection
  const getMaterialClass = () => {
    if (reduceTransparency) {
      // Fallback §8.5.3: Solid opaque fill saat reduce transparency
      return 'bg-background border border-border';
    }

    if (material === 'functional') {
      // Material Kaca Fluidik (§4.2.5)
      switch (effectiveVariant) {
        case 'clear':
          return 'glass-clear';
        case 'thick':
          return 'glass-thick';
        case 'regular':
        default:
          return 'glass-regular';
      }
    } else {
      // Material Standar (§4.3)
      switch (effectiveVariant) {
        case 'thin':
          return 'material-thin';
        case 'thick':
          return 'material-thick';
        case 'regular':
        default:
          return 'material-regular';
      }
    }
  };

  // Guidelines.md §1.4.1: 8-point grid spacing
  const getDensityClass = () => {
    switch (density) {
      case 'compact':
        return 'p-4'; // 16px (2 * 8px)
      case 'thin':
        return 'p-3';
      case 'ultra-thin':
        return 'p-2';
      case 'regular':
        return 'p-6'; // 24px (3 * 8px)
      case 'spacious':
        return 'p-8'; // 32px (4 * 8px)
      default:
        return 'p-6';
    }
  };

  // Calculate vibrancy context (Phase 5.6)
  const glassBackgroundColor = useMemo(
    () => (reduceTransparency ? '#000000' : '#80808080'),
    [reduceTransparency]
  );
  const vibrancy = useVibrancy(glassBackgroundColor);

  const vibrancyData = useMemo(() => {
    if (material !== 'functional') {
      return null;
    }

    return {
      isGlass: true,
      backgroundColor: glassBackgroundColor,
      textColor: vibrancy.textColor,
      secondaryTextColor: vibrancy.secondaryTextColor,
      contrastRatio: vibrancy.contrastRatio,
    };
  }, [material, glassBackgroundColor, vibrancy.textColor, vibrancy.secondaryTextColor, vibrancy.contrastRatio]);

  const materialClass = getMaterialClass();
  const densityClass = getDensityClass();

  // Guidelines.md §8.5.4: Reduce saturation/vibrancy saat window tidak aktif (Desktop only)
  // Hanya berlaku untuk functional glass yang bukan transparent mode
  const windowFocusClass = !isFocused && material === 'functional' && !reduceTransparency
    ? 'saturate-75 opacity-90'
    : '';
  
  // Add smooth transition for window focus changes
  const transitionClass = 'transition-all duration-300 ease-out';

  // Guidelines.md §8.5.2: CRITICAL - Clear glass MUST have dimming
  // Mitigation untuk kontras failure
  const needsDimming =
    effectiveVariant === 'clear' && material === 'functional' && withDimming;

  const Comp = Component as React.ElementType;

  const content = (
    <Comp
      ref={ref as React.Ref<HTMLElement>}
      className={cn('relative overflow-hidden', className)}
      style={style}
      {...rest}
    >
      {/* Dimming layer untuk Clear glass (§8.5.2) */}
      {needsDimming && !reduceTransparency && (
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
      )}

      {/* Main glass material */}
      <div className={cn(materialClass, densityClass, windowFocusClass, transitionClass, 'relative z-10')}>{children}</div>
    </Comp>
  );

  // Wrap dengan context jika functional glass (untuk VibrantText)
  if (vibrancyData) {
    return (
      <GlassPanelContext.Provider value={vibrancyData}>
        {content}
      </GlassPanelContext.Provider>
    );
  }

  return content;
});

GlassPanel.displayName = 'GlassPanel';

/**
 * GlassPanelTile - Variant untuk interactive cards
 * Menggunakan hover effects dan spring animations
 */
interface GlassPanelTileProps extends GlassPanelProps {
  onClick?: () => void;
  interactive?: boolean;
}

export const GlassPanelTile: React.FC<GlassPanelTileProps> = ({
  children,
  onClick,
  interactive = true,
  className = '',
  ...props
}) => {
  const interactiveClasses = interactive
    ? 'cursor-pointer transition-spring hover:scale-[1.02] active:scale-[0.98] card-interactive'
    : '';

  return (
    <GlassPanel
      {...props}
      className={`${interactiveClasses} ${className}`.trim()}
      as={onClick ? 'button' : 'div'}
      {...(onClick && { onClick })}
    >
      {children}
    </GlassPanel>
  );
};