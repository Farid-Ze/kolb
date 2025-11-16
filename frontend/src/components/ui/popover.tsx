/**
 * KLSI 4.0 - Popover Component (Enhanced)
 * Task TODO2.md Phase 3.10: Popover dengan spring scale/fade animation
 * 
 * Implementasi sesuai Guidelines.md:
 * §1.6: Popover untuk tindakan sekunder, non-interruptive
 * §2.3.1: Spring physics untuk natural scale/fade
 * §4.2: Glass material untuk functional layer
 * 
 * Enhancement dari Radix UI Popover:
 * - Spring-based scale + fade animations
 * - Glass material bubble
 * - Origin dari trigger element
 * - Reduce motion fallback
 */

"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover@1.1.6";
import { motion } from "motion/react";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { SPRING_SNAPPY, CROSS_FADE } from "../../lib/motion";
import { cn } from "./utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * PopoverContent - Enhanced dengan spring scale animation
 * 
 * Guidelines.md §1.6 & §2.3.1:
 * - Muncul sebagai "gelembung" dari trigger
 * - Scale + fade animation dengan spring
 * - Tidak interruptive (bukan modal)
 * - Glass material untuk hierarchy
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const reduceMotion = useReduceMotion();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            "z-popover w-72 rounded-lg border shadow-lg outline-none",
            // Glass material (Guidelines.md §4.2)
            "glass-regular p-4",
            className
          )}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.95 }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1 }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.95 }
          }
          transition={
            reduceMotion
              ? CROSS_FADE
              : SPRING_SNAPPY
          }
          style={{
            transformOrigin: "var(--radix-popover-content-transform-origin)",
          }}
        />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/**
 * PopoverHeader - Optional header section
 */
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("mb-3 pb-3 border-b", className)}
      {...props}
    />
  );
}

/**
 * PopoverTitle - Title for popover
 */
function PopoverTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="popover-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}

/**
 * PopoverBody - Content area
 */
function PopoverBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-body"
      className={cn("space-y-2", className)}
      {...props}
    />
  );
}

/**
 * PopoverFooter - Optional footer with actions
 */
function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-footer"
      className={cn("mt-3 pt-3 border-t flex gap-2 justify-end", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverBody,
  PopoverFooter,
};