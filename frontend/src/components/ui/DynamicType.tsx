/**
 * KLSI 4.0 - DynamicType Component
 * Task TODO3.md Phase 3: Dynamic Type wrapper for accessibility
 * 
 * Implementasi sesuai Guidelines.md §1.4.3:
 * - Skala Teks Dinamis (Dynamic Type)
 * - Mendukung preferensi aksesibilitas sistem
 * - Layout harus beradaptasi dengan mulus saat ukuran font berubah
 * - Tidak boleh ada clipping atau overlap pada ukuran XXXL+
 * 
 * @example
 * <DynamicType as="h1" level="title1">Heading</DynamicType>
 * <DynamicType as="p" level="body">Body text</DynamicType>
 */

import React, { ElementType, ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { useTextScaleFactor } from '../../lib/accessibility';

/**
 * Typography scale sesuai Guidelines.md §1.4.3
 * Menggunakan rem units untuk mendukung user preference scaling
 */
export type TypographyLevel =
  | 'largeTitle'    // 2.125rem base
  | 'title1'        // 1.75rem base
  | 'title2'        // 1.375rem base
  | 'title3'        // 1.25rem base
  | 'headline'      // 1.125rem base
  | 'body'          // 1rem base (default)
  | 'callout'       // 0.9375rem base
  | 'subheadline'   // 0.875rem base
  | 'footnote'      // 0.8125rem base
  | 'caption1'      // 0.75rem base
  | 'caption2';     // 0.6875rem base

interface DynamicTypeProps extends HTMLAttributes<HTMLElement> {
  /** HTML element to render */
  as?: ElementType;
  /** Typography level from scale */
  level?: TypographyLevel;
  /** Children content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Text weight override */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

/**
 * Typography scale mapping
 * Guidelines.md §1.4.3: Skala Teks Dinamis
 * Using rem units that scale with user preferences
 */
const typographyClasses: Record<TypographyLevel, string> = {
  largeTitle: 'text-[2.125rem] leading-tight tracking-tight',
  title1: 'text-[1.75rem] leading-tight tracking-tight',
  title2: 'text-[1.375rem] leading-snug tracking-tight',
  title3: 'text-[1.25rem] leading-snug tracking-normal',
  headline: 'text-[1.125rem] leading-normal tracking-normal',
  body: 'text-[1rem] leading-normal tracking-normal',
  callout: 'text-[0.9375rem] leading-normal tracking-normal',
  subheadline: 'text-[0.875rem] leading-relaxed tracking-normal',
  footnote: 'text-[0.8125rem] leading-relaxed tracking-normal',
  caption1: 'text-[0.75rem] leading-relaxed tracking-wide',
  caption2: 'text-[0.6875rem] leading-relaxed tracking-wide',
};

/**
 * Weight mapping
 */
const weightClasses: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

/**
 * DynamicType Component
 * 
 * Guidelines.md §1.4.3: Skala Teks Dinamis
 * - Layout beradaptasi dengan perubahan ukuran font pengguna
 * - Mendukung aksesibilitas (XXXL+ sizes)
 * - Menggunakan rem units, bukan px
 * - Semantic HTML elements
 * 
 * @example
 * ```tsx
 * <DynamicType as="h1" level="largeTitle">
 *   Welcome to KLSI 4.0
 * </DynamicType>
 * 
 * <DynamicType as="p" level="body" className="text-muted-foreground">
 *   This text scales with user preferences
 * </DynamicType>
 * ```
 */
export const DynamicType: React.FC<DynamicTypeProps> = ({
  as: Component = 'span',
  level = 'body',
  children,
  className,
  weight,
  ...rest
}) => {
  return (
    <Component
      className={cn(
        typographyClasses[level],
        weight && weightClasses[weight],
        // Guidelines.md §1.4.3: Text harus line-wrap, tidak terpotong
        'break-words',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

/**
 * Pre-configured typography components for common use cases
 */
export const LargeTitle: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="h1" level="largeTitle" {...props} />
);

export const Title1: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="h1" level="title1" {...props} />
);

export const Title2: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="h2" level="title2" {...props} />
);

export const Title3: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="h3" level="title3" {...props} />
);

export const Headline: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="h4" level="headline" {...props} />
);

export const Body: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="p" level="body" {...props} />
);

export const Callout: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="p" level="callout" {...props} />
);

export const Subheadline: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="p" level="subheadline" {...props} />
);

export const Footnote: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="p" level="footnote" {...props} />
);

export const Caption1: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="span" level="caption1" {...props} />
);

export const Caption2: React.FC<Omit<DynamicTypeProps, 'as' | 'level'>> = (props) => (
  <DynamicType as="span" level="caption2" {...props} />
);

/**
 * Additional utility components for specific use cases
 * Guidelines.md §1.4.3: Text measure (45-75 characters)
 */

export interface FontScaleState {
  scale: number;
  isXXXL: boolean;
}

/** Hook to access current font scale */
export const useFontScale = (): FontScaleState => {
  const scale = useTextScaleFactor();
  return {
    scale,
    isXXXL: scale >= 1.4,
  };
};

interface LongFormTextProps extends Omit<DynamicTypeProps, 'as' | 'level'> {
  /** Maximum characters per line (Guidelines.md §1.4.3: 45-75 chars) */
  maxCharacters?: number;
}

/** 
 * Long-form text component with optimal line length 
 * Guidelines.md §1.4.3: Keep line length between 45-75 characters
 */
export const LongFormText: React.FC<LongFormTextProps> = ({ 
  maxCharacters = 70, 
  className,
  ...props 
}) => (
  <DynamicType
    as="p"
    level="body"
    className={cn(
      'text-left', // Guidelines.md §1.4.2: Never center long text
      maxCharacters && `max-w-[${maxCharacters}ch]`,
      className
    )}
    {...props}
  />
);

/**
 * Short label component for headings and labels
 */
export const ShortLabel: React.FC<DynamicTypeProps> = ({ 
  as = 'span',
  level = 'headline',
  ...props 
}) => (
  <DynamicType
    as={as}
    level={level}
    {...props}
  />
);

/**
 * Description text component with optimal readability
 */
export const DescriptionText: React.FC<LongFormTextProps> = ({
  maxCharacters = 65,
  className,
  ...props
}) => (
  <DynamicType
    as="p"
    level="callout"
    className={cn(
      'text-left',
      maxCharacters && `max-w-[${maxCharacters}ch]`,
      className
    )}
    {...props}
  />
);