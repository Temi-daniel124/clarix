"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A field label, above its field (DESIGN_SYSTEM.md §5.2): `small` in `ink-500`. An "(optional)" or
 * other aside inside it keeps the same colour; the 8px gap separates them.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 type-small text-ink-500 select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
