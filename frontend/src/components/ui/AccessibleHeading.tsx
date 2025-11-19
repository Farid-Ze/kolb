/**
 * AccessibleHeading
 * Guidelines.md §1.4.3 & §3.4: Dynamic Type + minimum contrast enforcement
 * Digunakan untuk header/section utama agar teks tidak clipping pada ukuran XXXL
 * dan tetap memenuhi rasio kontras WCAG.
 */
import React, { ElementType, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { DynamicType, TypographyLevel, useFontScale } from './DynamicType';
import { useContrastGuard } from '../../hooks/useContrastGuard';
import { WCAGLevel } from '../../lib/accessibility';

export type AccessibleHeadingVariant = 'page' | 'section' | 'subsection' | 'eyebrow';

const variantLevelMap: Record<AccessibleHeadingVariant, TypographyLevel> = {
  page: 'largeTitle',
  section: 'title2',
  subsection: 'title3',
  eyebrow: 'headline',
};

const defaultElementMap: Record<AccessibleHeadingVariant, ElementType> = {
  page: 'h1',
  section: 'h2',
  subsection: 'h3',
  eyebrow: 'h4',
};

export interface AccessibleHeadingProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: AccessibleHeadingVariant;
  contrastLevel?: WCAGLevel;
  foregroundVar?: string;
  backgroundVar?: string;
}

export const AccessibleHeading: React.FC<AccessibleHeadingProps> = ({
  as,
  variant = 'section',
  contrastLevel = WCAGLevel.AA,
  foregroundVar = '--foreground',
  backgroundVar = '--background',
  className,
  children,
  ...rest
}) => {
  const { scale } = useFontScale();
  const { color } = useContrastGuard({
    foregroundVar,
    backgroundVar,
    level: contrastLevel,
  });

  const element: ElementType = as ?? defaultElementMap[variant];
  const level: TypographyLevel = variantLevelMap[variant];

  return (
    <DynamicType
      as={element}
      level={level}
      className={cn(
        'text-balance tracking-tight',
        scale >= 1.35 ? 'leading-relaxed' : 'leading-tight',
        className
      )}
      style={color ? { color } : undefined}
      {...rest}
    >
      {children}
    </DynamicType>
  );
};
