import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Chips, DESIGN_SYSTEM.md §5.6 with §4.1 and §4.4.
 *
 * `Chip` is a label that says something about a thing: a status, a flag, "Declared". It is not
 * interactive. `radius-sm`, `small` text, an optional 16px lucide icon (§6), and one of four tones:
 *
 *   neutral   surface-sunken / ink-500
 *   positive  emerald-100 / emerald-700   (§4.1: emerald-100 is the chip background)
 *   attention amber-50 / amber-700
 *   stop      red-50 / red-700
 *
 * `FilterChip` is a toggle in a row of filters (§5.4 "filters and sort"): `radius-pill`, and
 * `aria-pressed` carries its state. A single choice among a few options is a SegmentedControl
 * instead; filter chips are for options that combine.
 */
export type ChipTone = "neutral" | "positive" | "attention" | "stop";

const TONES: Record<ChipTone, string> = {
  neutral: "bg-surface-sunken text-ink-500",
  positive: "bg-emerald-100 text-emerald-700",
  attention: "bg-amber-50 text-amber-700",
  stop: "bg-red-50 text-red-700",
};

const ICON = "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:[stroke-width:1.75]";

export function Chip({
  tone = "neutral",
  icon,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { tone?: ChipTone; icon?: ReactNode }) {
  return (
    <span
      data-slot="chip"
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-sm px-3 type-small whitespace-nowrap tabular",
        TONES[tone],
        ICON,
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

export function FilterChip({
  selected,
  icon,
  className,
  children,
  ...props
}: Omit<ComponentProps<"button">, "aria-pressed"> & { selected: boolean; icon?: ReactNode }) {
  return (
    <button
      type="button"
      data-slot="filter-chip"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-pill border px-4 type-small whitespace-nowrap",
        "transition-[background-color,border-color,color,transform] duration-[var(--duration-spring)] ease-[var(--ease-spring)] active:scale-[0.98]",
                "disabled:pointer-events-none disabled:opacity-40",
        selected
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-hairline-strong bg-surface text-ink-900 hover:bg-surface-sunken",
        ICON,
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
