/**
 * KLSI 4.0 - FormInput Component
 * Task TODO2.md Phase 5.3-5.4: Form input dengan semantic colors & proper feedback
 * 
 * Implementasi sesuai Guidelines.md:
 * §3.4.3: Jangan andalkan warna saja - WAJIB pasangkan dengan ikon dan label
 * §3.5.1: Semantic colors (success/error/warning)
 * §1.4.3: Dynamic Type support
 * 
 * Features:
 * - Error state dengan ikon + label (bukan hanya warna)
 * - Success state dengan ikon + label
 * - Warning state dengan ikon + label
 * - WCAG 4.5:1 contrast compliance
 * - Accessibility-first
 */

import React, { forwardRef, ReactNode } from 'react';
import { Input } from './input';
import { Label } from './Label';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FormInputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  /** Input label */
  label?: string;
  /** Help text below input */
  helpText?: string;
  /** Error message (triggers error state) */
  error?: string;
  /** Success message (triggers success state) */
  success?: string;
  /** Warning message (triggers warning state) */
  warning?: string;
  /** Optional icon on the left */
  leftIcon?: ReactNode;
  /** Optional icon on the right */
  rightIcon?: ReactNode;
  /** Container className */
  containerClassName?: string;
  /** Required indicator */
  required?: boolean;
}

/**
 * FormInput - Input dengan semantic feedback lengkap
 * 
 * CRITICAL: Guidelines.md §3.4.3 - NEVER use color alone
 * Always pair color with icon AND text label
 * 
 * @example
 * // Error state
 * <FormInput
 *   label="Email"
 *   error="Email tidak valid"
 *   value={email}
 *   onChange={handleChange}
 * />
 * 
 * @example
 * // Success state
 * <FormInput
 *   label="Password"
 *   success="Password cukup kuat"
 *   type="password"
 * />
 * 
 * @example
 * // With icons
 * <FormInput
 *   label="Username"
 *   leftIcon={<User className="h-4 w-4" />}
 *   placeholder="username"
 * />
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      helpText,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      containerClassName,
      required,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided (for label association)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Determine state
    const hasError = !!error;
    const hasSuccess = !!success && !hasError;
    const hasWarning = !!warning && !hasError && !hasSuccess;

    // State icon & message (Guidelines.md §3.4.3)
    const stateIcon = hasError ? (
      <AlertCircle className="h-4 w-4 text-error" aria-hidden="true" />
    ) : hasSuccess ? (
      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
    ) : hasWarning ? (
      <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
    ) : null;

    const stateMessage = hasError ? error : hasSuccess ? success : hasWarning ? warning : null;

    const stateColor = hasError
      ? 'text-error'
      : hasSuccess
      ? 'text-success'
      : hasWarning
      ? 'text-warning'
      : '';

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {/* Label (Guidelines.md §1.4.3 - Dynamic Type) */}
        {label && (
          <Label htmlFor={inputId} className="text-foreground">
            {label}
            {required && (
              <span className="text-error ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              leftIcon && 'pl-10',
              (rightIcon || stateIcon) && 'pr-10',
              hasError && 'border-error focus-visible:border-error',
              hasSuccess && 'border-success focus-visible:border-success',
              hasWarning && 'border-warning focus-visible:border-warning',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              stateMessage
                ? `${inputId}-state-message`
                : helpText
                ? `${inputId}-help-text`
                : undefined
            }
            required={required}
            {...props}
          />

          {/* Right Icon or State Icon */}
          {(stateIcon || rightIcon) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {stateIcon || rightIcon}
            </div>
          )}
        </div>

        {/* State Message (Guidelines.md §3.4.3 - MUST include text, not just color) */}
        {stateMessage && (
          <div
            id={`${inputId}-state-message`}
            className={cn('flex items-start gap-2 text-sm', stateColor)}
            role={hasError ? 'alert' : 'status'}
            aria-live="polite"
          >
            {/* Icon repeated for clarity (accessible) */}
            {stateIcon}
            <span>{stateMessage}</span>
          </div>
        )}

        {/* Help Text (only show if no state message) */}
        {!stateMessage && helpText && (
          <p
            id={`${inputId}-help-text`}
            className="text-sm text-muted-foreground"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
