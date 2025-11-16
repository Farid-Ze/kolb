"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch@1.1.3";
import { motion } from "motion/react";

import { cn } from "./utils";
import { useMotionConfig, SPRING_FAST } from "../../lib/motion";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const transition = useMotionConfig(SPRING_FAST);
  
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      asChild
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        transition={transition}
        className={cn(
          "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-background focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          asChild
        >
          <motion.span
            className={cn(
              "bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0",
            )}
            animate={{
              x: props.checked ? "calc(100% - 2px)" : 0,
            }}
            transition={transition}
          />
        </SwitchPrimitive.Thumb>
      </motion.button>
    </SwitchPrimitive.Root>
  );
}

export { Switch };