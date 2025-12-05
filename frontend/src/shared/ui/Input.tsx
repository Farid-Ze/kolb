import * as React from "react"
import { useState, forwardRef, memo } from "react"

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

/**
 * AWWWARDS-LEVEL FLOATING INPUT
 * 
 * Premium input with animated floating label:
 * - Label floats up on focus/value
 * - Smooth transitions with premium easing
 * - Colored label on focus
 * - Matches dark theme design system
 */

interface FloatingInputProps extends Omit<InputProps, 'placeholder'> {
  label: string
  error?: string
}

const FloatingInput = memo(forwardRef<HTMLInputElement, FloatingInputProps>(
  function FloatingInput({ label, error, className, id, ...props }, ref) {
    const [isFocused, setIsFocused] = useState(false)
    const inputId = id || `floating-${label.toLowerCase().replace(/\s+/g, '-')}`
    
    // Check if input has value (controlled or uncontrolled)
    const hasValue = props.value !== undefined 
      ? String(props.value).length > 0 
      : false

    const isFloating = isFocused || hasValue

    return (
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={cn(
            INPUT_BASE_STYLES,
            // Extra padding top for floating label
            'pt-6 pb-2',
            // Peer class for label styling
            'peer',
            // Error state
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          placeholder=" " // Required for :placeholder-shown CSS
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        
        {/* Floating Label */}
        <label
          htmlFor={inputId}
          className={cn(
            'absolute left-4 pointer-events-none',
            'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'font-ui',
            // Default state (placeholder visible)
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2',
            'peer-placeholder-shown:text-sm peer-placeholder-shown:text-[var(--zen-text-subtle)]',
            // Floating state (focus or has value)
            'peer-focus:top-3 peer-focus:-translate-y-0',
            'peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.1em]',
            'peer-focus:text-[var(--zen-accent)]',
            // Not placeholder shown (has value)
            'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-0',
            'peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:uppercase',
            'peer-[:not(:placeholder-shown)]:tracking-[0.1em]',
            // Color based on focus
            isFloating && !isFocused && 'text-[var(--zen-text-muted)]',
            // Error state
            error && 'peer-focus:text-red-400'
          )}
        >
          {label}
        </label>
        
        {/* Error Message */}
        {error && (
          <p 
            id={`${inputId}-error`}
            className="mt-2 text-xs text-red-400 font-ui"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
))

FloatingInput.displayName = "FloatingInput"

export { Input, FloatingInput }
