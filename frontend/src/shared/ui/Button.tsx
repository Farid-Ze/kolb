import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-ui text-xs uppercase tracking-wider font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zen-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--zen-bg)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--zen-accent)] text-white shadow-lg shadow-blue-500/20",
        destructive: "bg-red-500 text-white shadow-lg shadow-red-500/20",
        outline: "border border-[var(--zen-border)] bg-transparent text-[var(--zen-text-muted)]",
        secondary: "bg-[var(--zen-bg-elevated)] text-[var(--zen-text)]",
        ghost: "text-[var(--zen-text-muted)]",
        link: "text-[var(--zen-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3 rounded-full",
        sm: "h-9 px-4 rounded-full",
        lg: "h-12 px-8 rounded-full",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Spring physics for premium feel
const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
}

// Hover/tap variants per button variant
const getMotionProps = (variant: string | null | undefined, disabled: boolean) => {
  if (disabled) return {}
  
  const baseProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: springTransition,
  }
  
  // Enhanced glow for default variant
  if (variant === "default" || !variant) {
    return {
      ...baseProps,
      whileHover: { 
        scale: 1.02,
        boxShadow: "0 10px 40px -10px rgba(59, 130, 246, 0.5)",
      },
    }
  }
  
  if (variant === "destructive") {
    return {
      ...baseProps,
      whileHover: { 
        scale: 1.02,
        boxShadow: "0 10px 40px -10px rgba(239, 68, 68, 0.5)",
      },
    }
  }
  
  if (variant === "outline") {
    return {
      ...baseProps,
      whileHover: { 
        scale: 1.02,
        borderColor: "rgba(255, 255, 255, 0.3)",
      },
    }
  }
  
  return baseProps
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, onClick, type = "button", ...props }, ref) => {
    // asChild uses Slot (no motion), otherwise use motion.button
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLElement>}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </Slot>
      )
    }
    
    const isDisabled = disabled || isLoading
    const motionProps = getMotionProps(variant, isDisabled ?? false)
    
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        onClick={onClick}
        type={type}
        aria-disabled={isDisabled}
        {...motionProps}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }
