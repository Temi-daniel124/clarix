"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

/**
 * The base-ui switch, reskinned to DESIGN_SYSTEM.md: emerald when on, border tone when off,
 * and the same indigo focus ring every other control uses.
 *
 * The thumb slides on `--ease-spring`, which is springStandard from src/lib/motion.ts solved as
 * a CSS easing: the same physics as every JavaScript-driven spring in the product rather than
 * a second motion vocabulary. The global prefers-reduced-motion rule in globals.css collapses
 * it to an instant change.
 */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5",
        "bg-border transition-colors duration-150 data-checked:bg-emerald",
        "outline-none focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "size-5 rounded-full bg-surface shadow-[0_1px_3px_rgba(11,18,32,0.25)]",
          "transition-[translate] duration-[var(--duration-spring)] ease-[var(--ease-spring)]",
          "data-checked:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
