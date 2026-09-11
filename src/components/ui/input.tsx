import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

/**
 * The base-ui input primitive, reskinned to DESIGN_SYSTEM.md tokens — 48px tall to match the
 * button scale, Clarix border and surface colours, and the indigo focus ring used everywhere
 * else in the product. No shadcn preset styling remains.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-card border border-border bg-surface px-4",
        "type-body text-text placeholder:text-text-muted",
        "transition-[border-color,box-shadow] duration-150 outline-none",
        "focus-visible:border-indigo focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-1",
        "disabled:pointer-events-none disabled:opacity-45",
        "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
