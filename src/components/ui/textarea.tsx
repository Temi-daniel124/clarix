import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A plain textarea wearing the Input's §5.2 tokens, same border, surface, radius and indigo
 * focus ring, so a multi-line field does not read as a different family of control.
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
        "min-h-32 w-full resize-y rounded-sm border border-hairline-strong bg-surface px-4 py-3",
        "type-body text-ink-900 placeholder:text-ink-400",
        "transition-[border-color] duration-150",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-invalid:border-red-500",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
