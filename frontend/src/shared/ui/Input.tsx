import * as React from "react"

import { cn } from "../lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const INPUT_BASE_STYLES = "flex h-12 w-full rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-input)] px-4 py-3 font-ui text-sm text-white placeholder:text-[var(--zen-text-subtle)] focus:outline-none focus:border-[var(--zen-accent)] focus:ring-2 focus:ring-[var(--zen-accent-muted)] transition-all disabled:cursor-not-allowed disabled:opacity-50"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(INPUT_BASE_STYLES, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
