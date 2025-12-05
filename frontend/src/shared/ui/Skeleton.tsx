import { memo } from 'react'
import { cn } from '../lib/utils'

/**
 * AWWWARDS-LEVEL SKELETON COMPONENTS
 * 
 * Premium loading placeholders with:
 * - Shimmer animation (GPU-optimized)
 * - Multiple variants (text, card, avatar, etc.)
 * - Respects reduced motion
 * - Consistent with dark theme
 */

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

// Base skeleton with shimmer
export const Skeleton = memo(function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-white/[0.03]',
        'before:absolute before:inset-0',
        'before:translate-x-[-100%]',
        'before:animate-shimmer',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-white/[0.04] before:to-transparent',
        'motion-reduce:before:animate-none',
        className
      )}
      style={style}
      aria-hidden="true"
    />
  )
})

// Text line skeleton
export const SkeletonText = memo(function SkeletonText({ 
  lines = 1,
  className 
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
  )
})

// Heading skeleton
export const SkeletonHeading = memo(function SkeletonHeading({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-8 w-48', className)} />
})

// Avatar skeleton
export const SkeletonAvatar = memo(function SkeletonAvatar({ 
  size = 'md',
  className 
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }
  
  return <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
})

// Card skeleton - matches Card component
export const SkeletonCard = memo(function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-[#0c0c14]/80 p-6',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={3} />
      </div>
    </div>
  )
})

// Stats card skeleton
export const SkeletonStats = memo(function SkeletonStats({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-[#0c0c14]/80 p-6',
        className
      )}
    >
      <Skeleton className="h-4 w-20 mb-3" />
      <Skeleton className="h-10 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
})

// Chart placeholder skeleton
export const SkeletonChart = memo(function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-[#0c0c14]/80 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-sm"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
})

// Table row skeleton
export const SkeletonTableRow = memo(function SkeletonTableRow({ 
  columns = 4,
  className 
}: SkeletonProps & { columns?: number }) {
  return (
    <div className={cn('flex items-center gap-4 py-4 border-b border-white/[0.04]', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4',
            i === 0 ? 'w-40' : 'flex-1'
          )} 
        />
      ))}
    </div>
  )
})

// Full page loading skeleton
export const SkeletonPage = memo(function SkeletonPage() {
  return (
    <div className="animate-hero-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
      {/* Header */}
      <div className="mb-8">
        <SkeletonHeading className="mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SkeletonStats />
        <SkeletonStats />
        <SkeletonStats />
        <SkeletonStats />
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
        <div>
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
})
