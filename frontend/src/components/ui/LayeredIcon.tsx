/**
 * KLSI 4.0 - LayeredIcon Component
 * Task TODO2.md Phase 8.1-8.2: Layered iconography implementation
 * 
 * Implementasi sesuai Guidelines.md §8.3.1:
 * - 3-layer rendering (background, middle, foreground)
 * - Dynamic lighting & shadow effects
 * - Light parallax effect on device tilt
 * - Spring-based animations
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface LayeredIconProps {
  /**
   * Icon component (from lucide-react) to render in each layer
   * Can be single icon or array of 3 icons for [background, middle, foreground]
   */
  icon: LucideIcon | [LucideIcon, LucideIcon, LucideIcon];
  
  /** Size of the icon container */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Accent color for middle layer */
  color?: 'primary' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4';
  
  /** Enable parallax effect on hover */
  enableParallax?: boolean;
  
  /** Enable dynamic lighting */
  enableLighting?: boolean;
  
  /** Additional className */
  className?: string;
}

const sizeConfig = {
  sm: { container: 'h-12 w-12', icon: 'h-6 w-6' },
  md: { container: 'h-16 w-16', icon: 'h-8 w-8' },
  lg: { container: 'h-20 w-20', icon: 'h-10 w-10' },
  xl: { container: 'h-24 w-24', icon: 'h-12 w-12' },
};

const colorConfig = {
  primary: 'text-primary',
  'chart-1': 'text-chart-1',
  'chart-2': 'text-chart-2',
  'chart-3': 'text-chart-3',
  'chart-4': 'text-chart-4',
};

/**
 * LayeredIcon: Guidelines.md §8.3.1 implementation
 * Three-layer icon rendering with dynamic lighting and parallax
 */
export const LayeredIcon: React.FC<LayeredIconProps> = ({
  icon,
  size = 'md',
  color = 'primary',
  enableParallax = true,
  enableLighting = true,
  className,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Parse icons for each layer
  const icons = (Array.isArray(icon)
    ? icon
    : [icon, icon, icon]) as [LucideIcon, LucideIcon, LucideIcon];

  const [BackgroundIcon, MiddleIcon, ForegroundIcon] = icons;

  // Parallax effect based on mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableParallax) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    
    setMousePos({ x, y });
  };

  // Spring configuration (Guidelines.md §2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl',
        sizeConfig[size].container,
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
      whileHover={{ scale: 1.05 }}
      transition={springConfig}
    >
      {/* Background Layer - Shadow/Depth */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          x: mousePos.x * -8,
          y: mousePos.y * -8,
        }}
        transition={springConfig}
      >
        <BackgroundIcon 
          className={cn(
            sizeConfig[size].icon,
            'text-muted-foreground/20',
            'blur-[2px]'
          )} 
        />
      </motion.div>

      {/* Middle Layer - Colored accent with lighting */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          x: mousePos.x * -4,
          y: mousePos.y * -4,
        }}
        transition={springConfig}
      >
        <MiddleIcon 
          className={cn(
            sizeConfig[size].icon,
            colorConfig[color],
            enableLighting && isHovered && 'drop-shadow-[0_0_8px_currentColor]'
          )} 
        />
        
        {/* Dynamic highlight overlay (Guidelines §8.3.1 - lighting) */}
        {enableLighting && isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent mix-blend-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springConfig}
            style={{
              transform: `translate(${mousePos.x * 4}px, ${mousePos.y * 4}px)`,
            }}
          />
        )}
      </motion.div>

      {/* Foreground Layer - Sharp detail */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{
          x: mousePos.x * 2,
          y: mousePos.y * 2,
        }}
        transition={springConfig}
      >
        <ForegroundIcon 
          className={cn(
            sizeConfig[size].icon,
            'text-foreground',
            'drop-shadow-sm'
          )} 
        />
      </motion.div>

      {/* Dynamic shadow (Guidelines §8.3.1) */}
      {enableLighting && isHovered && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-2xl bg-gradient-radial from-primary/20 via-primary/10 to-transparent blur-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springConfig}
        />
      )}
    </motion.div>
  );
};

/**
 * Preset: Icon Card - Guidelines §5.3 Composition pattern
 */
export const LayeredIconCard: React.FC<{
  icon: LayeredIconProps['icon'];
  title: string;
  description: string;
  color?: LayeredIconProps['color'];
  size?: LayeredIconProps['size'];
  className?: string;
}> = ({ icon, title, description, color, size, className }) => {
  return (
    <div className={cn('flex items-start gap-4', className)}>
      <LayeredIcon 
        icon={icon} 
        color={color} 
        size={size}
        enableParallax
        enableLighting
      />
      <div className="flex-1 space-y-1">
        <h3 className="text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
