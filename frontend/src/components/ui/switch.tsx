"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { motion } from "motion/react";

import { cn } from "./utils";
import { useMotionConfig, SPRING_FAST } from "../../lib/motion";

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>;

function Switch({
  className,
  ...props
}: SwitchProps) {
  const transition = useMotionConfig(SPRING_FAST);
  
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      asChild
      {...props}
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        transition={transition}
        className={cn(
          "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-background focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          asChild
        >
          <motion.span
            layout
            className={cn(
              "bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform duration-200 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
            )}
            transition={transition}
          />
        </SwitchPrimitive.Thumb>
      </motion.button>
    </SwitchPrimitive.Root>
  );
}

export { Switch };