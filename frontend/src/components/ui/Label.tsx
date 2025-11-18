/**
 * KLSI 4.0 - Label Component
 * Task TODO2.md Phase 5.9: Label dengan label/secondaryLabel/tertiaryLabel
 * 
 * Implementasi sesuai Guidelines.md §3.2.4:
 * - Gunakan token warna label, secondaryLabel, tertiaryLabel
 * - Hierarchy melalui warna, bukan size
 * - Adapts otomatis untuk light/dark mode
 */

import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface LabelProps {
  children?: ReactNode;
  /** Hierarchy level - affects text color */
  hierarchy?: 'primary' | 'secondary' | 'tertiary';
  /** Semantic purpose */
  variant?: 'default' | 'muted' | 'destructive' | 'success' | 'warning';
  /** Visual weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** HTML for attribute (accessibility) */
  htmlFor?: string;
  /** Truncate with ellipsis */
  truncate?: boolean;
  /** Required indicator */
  required?: boolean;
  className?: string;
}

/**
 * Label - Text label dengan system color hierarchy
 * 
 * Guidelines.md §3.2.4:
 * - Primary: Main labels (label token)
 * - Secondary: Supporting info (secondaryLabel token)
 * - Tertiary: Least important (tertiaryLabel token)
 * 
 * Color tokens adapt automatically untuk:
 * - Light/Dark mode
 * - Increase Contrast accessibility
 * - Vibrancy when over glass
 * 
 * @example
 * // Form label
 * <Label htmlFor="email" hierarchy="primary" required>
 *   Email Address
 * </Label>
 * 
 * @example
 * // Secondary description
 * <Label hierarchy="secondary">
 *   Optional - we'll never share your email
 * </Label>
 * 
 * @example
 * // Tertiary metadata
 * <Label hierarchy="tertiary" variant="muted">
 *   Last updated 2 hours ago
 * </Label>
 */
export const Label: FC<LabelProps> = ({
  children,
  hierarchy = 'primary',
  variant = 'default',
  weight = 'normal',
  htmlFor,
  truncate = false,
  required = false,
  className = '',
}) => {
  // Guidelines §3.2.4 & §3.3: System color tokens
  const hierarchyClasses = {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    tertiary: 'text-muted-foreground/70',
  } satisfies Record<NonNullable<LabelProps['hierarchy']>, string>;

  // Semantic variants (§3.5.1)
  const variantClasses = {
    default: '',
    muted: 'text-muted-foreground',
    destructive: 'text-destructive',
    success: 'text-success',
    warning: 'text-warning',
  } satisfies Record<NonNullable<LabelProps['variant']>, string>;

  // Font weight
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  } satisfies Record<NonNullable<LabelProps['weight']>, string>;

  const Component = htmlFor ? 'label' : 'span';

  return (
    <Component
      htmlFor={htmlFor}
      className={cn(
        // Base styles
        'inline-block',
        // System color hierarchy
        variant === 'default' ? hierarchyClasses[hierarchy] : variantClasses[variant],
        // Weight
        weightClasses[weight],
        // Truncation
        truncate && 'truncate',
        className
      )}
    >
      {children}
      {required && (
        <span className="ml-1 text-destructive" aria-label="required">
          *
        </span>
      )}
    </Component>
  );
};

/**
 * FieldLabel - Preset for form field labels
 */
export const FieldLabel: FC<Omit<LabelProps, 'hierarchy'>> = (props) => (
  <Label hierarchy="primary" weight="medium" {...props} />
);

/**
 * HelperText - Preset for form helper text
 */
export const HelperText: FC<Omit<LabelProps, 'hierarchy'>> = (props) => (
  <Label hierarchy="secondary" className={cn('text-sm', props.className)} {...props} />
);

/**
 * MetadataLabel - Preset for tertiary metadata
 */
export const MetadataLabel: FC<Omit<LabelProps, 'hierarchy'>> = (props) => (
  <Label hierarchy="tertiary" className={cn('text-xs', props.className)} {...props} />
);

/**
 * SectionTitle - Bold primary label for sections
 */
export const SectionTitle: FC<Omit<LabelProps, 'hierarchy' | 'weight'>> = (props) => (
  <Label hierarchy="primary" weight="semibold" {...props} />
);
