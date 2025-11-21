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
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "./utils";
import { useMotionConfig } from "../../lib/motion";
import { SPRING_FAST, CROSS_FADE_FAST } from "../../lib/motion";
import { buttonVariants, type ButtonVariantProps } from "./button.variants";

type ButtonProps = Omit<
  React.ComponentProps<"button">,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragCapture"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDragExit"
> &
  Pick<HTMLMotionProps<"button">, "whileTap" | "whileHover" | "transition"> &
  ButtonVariantProps & {
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
    const slotProps = props as React.ComponentProps<typeof Slot>;
    // For Slot, fall back to plain button props only
    return (
      <Slot
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...slotProps}
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

export { Button };
export type { ButtonProps };