/**
 * KLSI 4.0 - SkeletonLoader Component
 * Task TODO2.md Phase 3.5: Skeleton loader dengan shimmer/pulse animation
 * 
 * Implementasi sesuai Guidelines.md §2.4.2:
 * - Manajemen ekspektasi (expectation management)
 * - Shimmer animation untuk perceived performance
 * - Menunjukkan struktur yang akan datang
 * - Lebih baik dari spinner abstrak
 * 
 * Justifikasi: Skeleton UI secara psikologis terasa lebih cepat karena
 * menunjukkan *struktur* yang akan datang, bukan proses abstrak.
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonLoaderProps {
  /** Variant of skeleton shape */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Animation style */
  animation?: 'shimmer' | 'pulse' | 'none';
  /** Custom className */
  className?: string;
}

/**
 * SkeletonLoader - Animated placeholder untuk loading states
 * 
 * @example
 * // Text skeleton
 * <SkeletonLoader variant="text" width="80%" />
 * 
 * // Avatar skeleton
 * <SkeletonLoader variant="circular" width={48} height={48} />
 * 
 * // Card skeleton
 * <SkeletonLoader variant="rounded" className="w-full h-32" />
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
  className,
}) => {
  // Variant-specific styling
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  // Animation classes (defined in globals.css)
  const animationClasses = {
    shimmer: 'skeleton', // Uses shimmer keyframe animation
    pulse: 'animate-pulse',
    none: '',
  };

  const styles: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(
        'bg-muted',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={styles}
      aria-busy="true"
      aria-live="polite"
    />
  );
};

/**
 * SkeletonText - Multiple text lines skeleton
 * 
 * @example
 * <SkeletonText lines={3} />
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          variant="text"
          width={index === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard - Card layout skeleton
 * 
 * @example
 * <SkeletonCard />
 */
export const SkeletonCard: React.FC<{
  hasImage?: boolean;
  className?: string;
}> = ({ hasImage = true, className }) => {
  return (
    <div className={cn('material-regular rounded-xl p-6 space-y-4', className)}>
      {hasImage && (
        <SkeletonLoader variant="rounded" className="w-full h-48" />
      )}
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="60%" height={24} />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

/**
 * SkeletonAvatar - Avatar with text skeleton
 * 
 * @example
 * <SkeletonAvatar />
 */
export const SkeletonAvatar: React.FC<{
  size?: number;
  withText?: boolean;
  className?: string;
}> = ({ size = 48, withText = true, className }) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <SkeletonLoader
        variant="circular"
        width={size}
        height={size}
      />
      {withText && (
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="40%" height={16} />
          <SkeletonLoader variant="text" width="60%" height={14} />
        </div>
      )}
    </div>
  );
};

/**
 * SkeletonList - List of items skeleton
 * 
 * @example
 * <SkeletonList items={5} />
 */
export const SkeletonList: React.FC<{
  items?: number;
  itemHeight?: number;
  className?: string;
}> = ({ items = 5, itemHeight = 64, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonLoader
          key={index}
          variant="rounded"
          height={itemHeight}
          className="w-full"
        />
      ))}
    </div>
  );
};

/**
 * SkeletonTable - Table skeleton
 * 
 * @example
 * <SkeletonTable rows={5} columns={4} />
 */
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonLoader key={index} variant="text" height={20} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonChart - Chart placeholder skeleton
 * 
 * @example
 * <SkeletonChart type="bar" />
 */
export const SkeletonChart: React.FC<{
  type?: 'bar' | 'line' | 'pie';
  className?: string;
}> = ({ type = 'bar', className }) => {
  if (type === 'pie') {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <SkeletonLoader
          variant="circular"
          width={200}
          height={200}
          animation="pulse"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-end gap-2 h-48 p-4', className)}>
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonLoader
          key={index}
          variant="rectangular"
          className="flex-1"
          height={`${Math.random() * 70 + 30}%`}
        />
      ))}
    </div>
  );
};

// Backwards-compatible aliases for legacy imports
export const Skeleton = SkeletonLoader;
export const ReportPageSkeleton = SkeletonChart;
export const DashboardSkeleton = SkeletonList;
export const CardSkeleton = SkeletonCard;
export const TableSkeleton = SkeletonTable;
