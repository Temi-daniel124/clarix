import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A plain textarea wearing the Input primitive's tokens, same border, surface, radius and
 * indigo focus ring, so a multi-line field does not read as a different family of control.
 *
 * base-ui has no textarea primitive, and wrapping its Input in one would misrepresent what it
 * renders. This is the only element in the product built on the native tag directly, which is
 * why the styling is copied deliberately rather than left to a default.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-32 w-full resize-y rounded-card border border-border bg-surface px-4 py-3",
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

export { Textarea };
