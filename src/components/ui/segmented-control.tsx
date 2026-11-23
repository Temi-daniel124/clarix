"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";

/**
 * Continuous Tabs, DESIGN_SYSTEM.md §5.6: a pill track on `surface-sunken` with a white pill that
 * slides to the chosen option on `springStandard` (instantly under reduced motion).
 *
 * Two roles, because they are announced differently:
 *   - `tabs`: the control switches the panel below it (a member's Overview / Savings / Loans).
 *     The caller gives the panel `role="tabpanel"` and `aria-labelledby` the active tab's id,
 *     from `segmentId(baseId, value)`.
 *   - `choice` (default): it picks one value for something else (a sort order, a filter).
 *
 * Arrow keys move between options and select them, as both ARIA patterns expect.
 */
export type Segment<T extends string> = { value: T; label: string };

export function segmentId(baseId: string, value: string) {
  return `${baseId}-${value}`;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  role = "choice",
  id,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The control's accessible name, e.g. "Member record" or "Sort members". */
  label: string;
  role?: "tabs" | "choice";
  /** Base id for the options, so a tab panel can point at its tab. */
  id?: string;
  className?: string;
}) {
  const generated = useId();
  const baseId = id ?? generated;
  const reduceMotion = useReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + segments.length) % segments.length;
    onChange(segments[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role={role === "tabs" ? "tablist" : "radiogroup"}
      aria-label={label}
      className={cn("flex w-fit max-w-full gap-1 overflow-x-auto rounded-pill bg-surface-sunken p-1", className)}
    >
      {segments.map((segment, index) => {
        const selected = segment.value === value;

        return (
          <button
            key={segment.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={segmentId(baseId, segment.value)}
            type="button"
            role={role === "tabs" ? "tab" : "radio"}
            aria-selected={role === "tabs" ? selected : undefined}
            aria-checked={role === "choice" ? selected : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(segment.value)}
            onKeyDown={(event) => move(event, index)}
            className={cn(
              // 44px on phones (the §10 touch target), 36px from 768px; 12px side padding on phones.
              "relative h-11 shrink-0 rounded-pill px-3 type-small whitespace-nowrap sm:px-4 md:h-9",
              "transition-[color] duration-150",
                            selected ? "text-ink-900" : "text-ink-500 hover:text-ink-900",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={`${baseId}-pill`}
                aria-hidden
                transition={reduceMotion ? { duration: 0 } : springStandard}
                className="absolute inset-0 rounded-pill bg-surface"
              />
            ) : null}
            <span className="relative">{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
