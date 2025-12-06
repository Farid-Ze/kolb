import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '../lib/utils'

/**
 * AWWWARDS-LEVEL CARD COMPONENT
 * 
 * Premium card with:
 * - Glass morphism effect
 * - Multiple variants (default, elevated, ghost)
 * - Optional glow effect
 * - Hover states
 * - GPU-optimized transitions
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'ghost' | 'interactive'
  glow?: boolean
  children: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', glow = false, className, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#0c0c14]/80 border-white/[0.06]',
      elevated: 'bg-[#0e0e18]/90 border-white/[0.08] shadow-xl shadow-black/20',
      ghost: 'bg-transparent border-white/[0.04]',
      interactive: [
        'bg-[#0c0c14]/80 border-white/[0.06]',
        'hover:border-blue-500/30 hover:bg-[#0e0e18]/90',
        'hover:shadow-lg hover:shadow-indigo-500/10',
        'hover:scale-[1.02]',
        'cursor-pointer',
      ].join(' '),
    }

    return (
      <div className="relative">
        {/* Optional glow effect */}
        {glow && (
          <div 
            className="absolute -inset-4 bg-indigo-500/5 blur-[40px] rounded-3xl pointer-events-none"
            aria-hidden="true"
          />
        )}
        
        <div
          ref={ref}
          className={cn(
            'relative rounded-2xl border backdrop-blur-xl gpu-transition',
            variants[variant],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-5 border-b border-white/[0.04]', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Component = 'h3', className, children, ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'font-headline text-lg font-bold text-white tracking-[-0.01em]',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
)

CardTitle.displayName = 'CardTitle'

// Card Description
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('font-ui text-sm text-gray-400 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
)

CardDescription.displayName = 'CardDescription'

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  noPadding?: boolean
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ noPadding = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(!noPadding && 'p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

// Card Footer
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 border-t border-white/[0.04] flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

// Stats Card - Specialized variant
interface StatsCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
  className?: string
}

export function StatsCard({ 
  label, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  className 
}: StatsCardProps) {
  const changeColors = {
    positive: 'text-cyan-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-ui text-xs uppercase tracking-[0.15em] text-gray-500 mb-2">
            {label}
          </p>
          <p className="font-headline text-3xl font-bold text-white tracking-tight">
            {value}
          </p>
          {change && (
            <p className={cn('font-ui text-xs mt-2', changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
