/**
 * KLSI 4.0 - TintedGlassPanel Component
 * Task TODO3.md Phase 2: Volumetric tinting on glass material
 * 
 * Guidelines.md §3.5.3:
 * - Tinting volumetrik (bukan overlay datar)
 * - Warna dicampur ke dalam "kaca" itu sendiri
 * - Bereaksi dengan properti optik material
 * - Memengaruhi highlights dan shadows
 * - Gunakan hemat untuk penekanan interaktif
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { GlassPanel, type GlassPanelProps } from './GlassPanel';

export interface TintedGlassPanelProps extends Omit<GlassPanelProps, 'material'> {
  /** Tint color (primary accent or chart colors) */
  tintColor?: 'primary' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'success' | 'warning';
  /** Tint intensity (0-100) */
  tintIntensity?: number;
}

/**
 * TintedGlassPanel - Glass with volumetric color tinting
 * 
 * Guidelines.md §3.5.3: Tinting diterapkan seolah warna dicampur
 * ke dalam kaca, bereaksi dengan cahaya dan memengaruhi highlights.
 * 
 * @example
 * // Primary CTA button with subtle tint
 * <TintedGlassPanel tintColor="primary" tintIntensity={15}>
 *   <button>Submit</button>
 * </TintedGlassPanel>
 * 
 * // Accent card with moderate tint
 * <TintedGlassPanel tintColor="chart-2" tintIntensity={25}>
 *   <h3>Featured Content</h3>
 * </TintedGlassPanel>
 */
export const TintedGlassPanel = React.forwardRef<
  HTMLDivElement,
  TintedGlassPanelProps
>(({
  tintColor = 'primary',
  tintIntensity = 20,
  className,
  children,
  style,
  ...rest
}, ref) => {
  // Tint color mapping
  const tintColorMap: Record<'primary' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'success' | 'warning', string> = {
    'primary': 'var(--primary)',
    'chart-1': 'var(--chart-1)',
    'chart-2': 'var(--chart-2)',
    'chart-3': 'var(--chart-3)',
    'chart-4': 'var(--chart-4)',
    'success': 'var(--chart-success, #22c55e)',
    'warning': 'var(--chart-warning, #f59e0b)',
  };

  const tintColorVar = tintColor ? tintColorMap[tintColor] : tintColorMap.primary;
  const inlineStyle = {
    background: `color-mix(in srgb, ${tintColorVar} ${tintIntensity}%, transparent)`,
    ...style,
  } satisfies React.CSSProperties;

  return (
    <GlassPanel
      ref={ref}
      material="functional"
      className={cn('relative overflow-hidden', className)}
      style={inlineStyle}
      {...rest}
    >
      {/* Subtle gradient overlay for depth (simulates light interaction) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${tintColorVar} 40%, transparent), transparent 70%)`,
        }}
      />
      
      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </GlassPanel>
  );
});

TintedGlassPanel.displayName = 'TintedGlassPanel';
