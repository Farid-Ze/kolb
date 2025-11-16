/**
 * KLSI 4.0 - Card Component
 * Task TODO2.md Phase 4.10: Card dengan prinsip Gestalt Common Region
 * 
 * Implementasi sesuai Guidelines.md §1.5:
 * - Common Region: Latar belakang bersama menunjukkan grouping
 * - Menggunakan ContentGlass (material-regular)
 * - Proximity: Elemen terkait berdekatan
 * - Negative space sebagai pemisah
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useMotionConfig, SPRING_CONFIG, CROSS_FADE } from '../../lib/motion';

interface CardProps {
  children: ReactNode;
  /** Material variant */
  material?: 'content' | 'functional';
  /** Variant affects glass opacity */
  variant?: 'regular' | 'thin' | 'thick';
  /** Apply padding (use false for custom spacing) */
  withPadding?: boolean;
  /** Make card interactive */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Hover effect */
  hover?: 'none' | 'lift' | 'scale';
  className?: string;
}

/**
 * Card - Container component with Common Region principle
 * 
 * Guidelines.md §1.5 - Prinsip Gestalt:
 * - Common Region: Batas visual sama = grouping
 * - Proximity: Elemen berdekatan = terkait
 * - Negative space > separator lines
 * 
 * Uses material-regular for content layer (§4.3)
 * Not functional glass (reserved for navigation §4.2)
 * 
 * @example
 * // Basic card
 * <Card>
 *   <h3>Profile</h3>
 *   <p>User information</p>
 * </Card>
 * 
 * @example
 * // Interactive card dengan hover
 * <Card interactive hover="lift" onClick={handleClick}>
 *   <article>Clickable content</article>
 * </Card>
 * 
 * @example
 * // Custom spacing dengan composition
 * <Card withPadding={false}>
 *   <CardHeader>Title</CardHeader>
 *   <CardContent>Body</CardContent>
 *   <CardFooter>Actions</CardFooter>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  children,
  material = 'content',
  variant = 'regular',
  withPadding = true,
  interactive = false,
  onClick,
  hover = 'none',
  className = '',
}) => {
  const transition = useMotionConfig(SPRING_CONFIG, CROSS_FADE);

  // Material classes (Guidelines §4.3)
  const getMaterialClass = () => {
    if (material === 'functional') {
      return 'glass-regular';
    }
    // Content material (default)
    switch (variant) {
      case 'thin':
        return 'material-thin';
      case 'thick':
        return 'material-thick';
      case 'regular':
      default:
        return 'material-regular';
    }
  };

  // Hover animation configs
  const hoverEffects = {
    none: {},
    lift: {
      y: -4,
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    },
    scale: {
      scale: 1.02,
    },
  };

  const Component = interactive || onClick ? motion.button : motion.div;
  const componentProps = interactive || onClick ? { onClick, type: 'button' as const } : {};

  return (
    <Component
      className={cn(
        // Base styles
        'rounded-xl border border-border/50',
        getMaterialClass(),
        // Padding (Guidelines §1.4.1 - 8px grid)
        withPadding && 'p-6',
        // Interactive
        interactive && [
          'cursor-pointer',
          'transition-shadow duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'active:scale-[0.98]',
        ],
        // Text alignment (default left for readability §1.4.2)
        'text-left',
        className
      )}
      whileHover={interactive || onClick ? hoverEffects[hover] : undefined}
      transition={transition}
      {...componentProps}
    >
      {children}
    </Component>
  );
};

/**
 * CardHeader - Header section dengan semantic spacing
 * 
 * Guidelines §1.5 - Proximity:
 * Spacing yang konsisten menunjukkan grouping
 */
interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardSectionProps> = ({ children, className = '' }) => (
  <div className={cn('space-y-2 mb-4', className)}>{children}</div>
);

/**
 * CardTitle - Primary title dengan hierarchy
 */
interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
  <h3 className={cn('text-foreground font-semibold', className)}>{children}</h3>
);

/**
 * CardDescription - Secondary description
 */
export const CardDescription: React.FC<CardSectionProps> = ({ children, className = '' }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
);

/**
 * CardContent - Main content area
 * 
 * Guidelines §1.5 - Negative Space:
 * Space-y-4 creates visual grouping tanpa separator
 */
export const CardContent: React.FC<CardSectionProps> = ({ children, className = '' }) => (
  <div className={cn('space-y-4', className)}>{children}</div>
);

/**
 * CardFooter - Footer dengan actions
 * 
 * Guidelines §1.5 & §1.4.1: Proximity - spasi lebih baik dari separator
 */
export const CardFooter: React.FC<CardSectionProps> = ({ children, className = '' }) => (
  <div className={cn('flex items-center gap-4 mt-8', className)}>
    {children}
  </div>
);

/**
 * CardGrid - Grid layout untuk multiple cards
 * 
 * Guidelines §1.2.2 - Responsive:
 * - Mobile: 1 column (stacked)
 * - Tablet: 2 columns
 * - Desktop: 3+ columns
 */
interface CardGridProps {
  children: ReactNode;
  columns?: {
    sm?: 1 | 2;
    md?: 2 | 3;
    lg?: 3 | 4;
  };
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3 },
  className = '',
}) => {
  const columnClasses = `grid gap-6 grid-cols-${columns.sm || 1} md:grid-cols-${
    columns.md || 2
  } lg:grid-cols-${columns.lg || 3}`;

  return <div className={cn(columnClasses, className)}>{children}</div>;
};