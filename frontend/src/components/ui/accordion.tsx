"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "./utils";
import { useMotionConfig, SPRING_SMOOTH } from "../../lib/motion";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

type AccordionTriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  ["data-state"]?: "open" | "closed";
};

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const transition = useMotionConfig(SPRING_SMOOTH);
  const motionProps = props as React.ComponentProps<typeof motion.button>;
  
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        asChild
      >
        <motion.button
          className={cn(
            "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
          whileHover={{ x: 2 }}
          transition={transition}
          {...motionProps}
        >
          {children}
          <motion.div
            className="text-muted-foreground pointer-events-none shrink-0 translate-y-0.5"
            animate={{ rotate: props['data-state'] === 'open' ? 180 : 0 }}
            transition={transition}
          >
            <ChevronDownIcon className="size-4" />
          </motion.div>
        </motion.button>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const transition = useMotionConfig(SPRING_SMOOTH);
  
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      asChild
      {...props}
    >
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={transition}
        className="overflow-hidden text-sm"
      >
        <div className={cn("pt-0 pb-4", className)}>{children}</div>
      </motion.div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };