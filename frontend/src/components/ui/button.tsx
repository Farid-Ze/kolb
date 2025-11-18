/**
 * KLSI 4.0 - Button Component
 * 
 * Implementasi sesuai Guidelines.md:
 * §2.2.1: Flexing motion untuk umpan balik instan <100ms
 * §3.4.1: Warna aksen untuk interaktivitas
 * §2.3.1: Spring physics untuk smooth interaction
 * §2.5: Reduce motion fallback
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "./utils";
import { useMotionConfig } from "../../lib/motion";
import { SPRING_FAST, CROSS_FADE_FAST } from "../../lib/motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Guidelines.md §3.4.1: Primary interactive (accent color)
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        // Guidelines.md §3.4.1: Link interactive (accent color)
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  Pick<HTMLMotionProps<"button">, "whileTap" | "whileHover" | "transition"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    disableMotion?: boolean;
  };

/**
 * Button - Interactive button dengan spring physics
 * 
 * Guidelines.md §2.2.1 - Flexing motion:
 * - whileTap scale + brightness untuk umpan balik <100ms
 * - Spring transition untuk smooth & interruptible
 * - Reduce motion fallback otomatis
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  disableMotion = false,
  disabled,
  whileTap,
  whileHover,
  transition: transitionOverride,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const transition = useMotionConfig(SPRING_FAST, CROSS_FADE_FAST);

  // Guidelines.md §2.2.1: Flexing (Melentur) untuk instant feedback
  const motionProps: HTMLMotionProps<"button"> =
    disableMotion || disabled
      ? {}
      : {
          whileTap: whileTap ?? {
            scale: 0.95,
            filter: "brightness(1.1)",
          },
          whileHover: whileHover ?? {
            scale: 1.02,
          },
          transition: transitionOverride ?? transition,
        };

  if (asChild) {
    // For Slot, we can't use motion directly
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled}
        {...props}
      />
    );
  }

  return (
    <motion.button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      {...motionProps}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };