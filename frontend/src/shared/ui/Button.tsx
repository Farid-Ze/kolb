import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-ui text-xs uppercase tracking-wider font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zen-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--zen-bg)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--zen-accent)] text-white hover:bg-[var(--zen-accent-hover)] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
        outline: "border border-[var(--zen-border)] bg-transparent text-[var(--zen-text-muted)] hover:border-[var(--zen-border-hover)] hover:text-white",
        secondary: "bg-[var(--zen-bg-elevated)] text-[var(--zen-text)] hover:bg-[var(--zen-bg-card)]",
        ghost: "text-[var(--zen-text-muted)] hover:bg-[var(--zen-accent-muted)] hover:text-white",
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
