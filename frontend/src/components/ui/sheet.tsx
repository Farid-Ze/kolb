/**
 * KLSI 4.0 - Sheet Component (Enhanced)
 * Task TODO2.md Phase 3.9: Sheet dengan spring physics dan ergonomic positioning
 * 
 * Implementasi sesuai Guidelines.md:
 * §1.6: Sheet untuk tugas terfokus dengan CTA di Zona Hijau (bottom)
 * §2.3.1: Spring physics untuk natural motion
 * §4.2: Glass material untuk functional layer
 * 
 * Enhancement dari Radix UI Dialog:
 * - Spring-based slide animations
 * - Glass material dengan dimming
 * - Ergonomic button placement (footer di bottom)
 * - Reduce motion fallback
 */

"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { motion } from "motion/react";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { SPRING_SLIDE, CROSS_FADE } from "../../lib/motion";
import { cn } from "./utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * SheetOverlay - Enhanced dengan glass material dan dimming
 * Guidelines.md §4.2.5: Dimming layer untuk kontras
 */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  const reduceMotion = useReduceMotion();

  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      asChild
      {...props}
    >
      <motion.div
        className={cn(
          "fixed inset-0 z-modal bg-black/35 backdrop-blur-sm",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduceMotion ? CROSS_FADE : { duration: 0.2 }}
      />
    </SheetPrimitive.Overlay>
  );
}

/**
 * SheetContent - Enhanced dengan spring physics
 * 
 * Guidelines.md §1.6 & §2.3.1:
 * - Slides from bottom pada mobile (ergonomic - Zona Hijau)
 * - Spring physics untuk natural motion
 * - Interruptible animations
 * - Glass material untuk functional layer
 */
type SheetSide = "top" | "right" | "bottom" | "left";
type SlideVariant = {
  hidden: { x?: string; y?: string };
  visible: { x?: number; y?: number };
};

function SheetContent({
  className,
  children,
  side = "bottom",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide;
}) {
  const reduceMotion = useReduceMotion();

  // Slide direction untuk spring animation
  const slideVariants: Record<SheetSide, SlideVariant> = {
    right: {
      hidden: { x: "100%" },
      visible: { x: 0 },
    },
    left: {
      hidden: { x: "-100%" },
      visible: { x: 0 },
    },
    top: {
      hidden: { y: "-100%" },
      visible: { y: 0 },
    },
    bottom: {
      hidden: { y: "100%" },
      visible: { y: 0 },
    },
  };

  // Position classes
  const positionClasses: Record<SheetSide, string> = {
    right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm rounded-l-xl",
    left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm rounded-r-xl",
    top: "inset-x-0 top-0 border-b rounded-b-xl max-h-[80vh]",
    bottom: "inset-x-0 bottom-0 border-t rounded-t-xl max-h-[80vh]",
  };

  const resolvedSide: SheetSide = side ?? "bottom";
  const resolvedPositionClass = positionClasses[resolvedSide];
  const resolvedVariant = slideVariants[resolvedSide];

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        asChild
        {...props}
      >
        <motion.div
          className={cn(
            "fixed z-modal flex flex-col shadow-xl",
            // Glass material (Guidelines.md §4.2)
            "glass-regular",
            resolvedPositionClass,
            className
          )}
          variants={reduceMotion ? undefined : resolvedVariant}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={reduceMotion ? CROSS_FADE : SPRING_SLIDE}
        >
          {/* Close button - top right */}
          <SheetPrimitive.Close className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100 hover:bg-secondary focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </motion.div>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

/**
 * SheetHeader - Top section of sheet
 */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 p-6 pb-4", className)}
      {...props}
    />
  );
}

/**
 * SheetFooter - Bottom section with CTA buttons
 * 
 * Guidelines.md §1.3.2 & §1.6:
 * - Positioned at bottom (Zona Hijau - ergonomic)
 * - Primary actions here for thumb reach
 * - Sticky positioning untuk always visible
 */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "sticky bottom-0 mt-auto flex flex-col-reverse sm:flex-row gap-2 p-6 pt-4",
        // Glass overlay untuk separate dari content
        "bg-background/95 backdrop-blur-md border-t",
        className
      )}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 * SheetBody - Content area (optional wrapper)
 */
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex-1 px-6 py-4 space-y-4", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetBody,
};