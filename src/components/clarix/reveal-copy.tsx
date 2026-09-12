"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";

/**
 * Reveal & Copy — the sensitive-figure pattern from docs/planning/clarix-design-system.md § 4.
 *
 * A figure that is nobody's business but the owner's is masked until they ask for it, and can
 * then be copied without being retyped. The design system adopts this specifically so that
 * "we don't casually expose your sensitive data" is something the product demonstrates rather
 * than claims, and Profile's salary rows are the first place that matters: a payslip figure
 * should not be sitting in plain sight when someone hands their phone over or shares a screen.
 *
 * This is not a second way of showing a number against a limit — it shows one figure, with no
 * comparison at all — so it does not compete with the RollingNumber/MeterBar motif. Anywhere a
 * figure IS being measured against a cap, that motif still applies and this does not.
 *
 * Masking is real: the digits are not in the DOM until revealed, so they are not exposed to a
 * screen reader, a text search, or a screenshot of the page's markup either.
 */
export function RevealCopy({
  label,
  value,
  formatted,
  className,
}: {
  label: string;
  /** The plain text placed on the clipboard — digits only, no currency symbol or grouping. */
  value: string;
  /** What is shown once revealed. Defaults to `value`. */
  formatted?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission refused. Reveal instead, so the figure can still be read off.
      setRevealed(true);
    }
  };

  const shown = formatted ?? value;

  return (
    <div className={cn("flex items-center justify-between gap-4 px-5 py-4", className)}>
      <span className="type-secondary text-text-secondary">{label}</span>

      <div className="flex items-center gap-1">
        <AnimatePresence mode="wait" initial={false}>
          {revealed ? (
            <motion.span
              key="value"
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={reduceMotion ? { duration: 0 } : springStandard}
              className="type-card-title tabular text-text"
            >
              {shown}
            </motion.span>
          ) : (
            <motion.span
              key="masked"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.12 }}
              aria-hidden
              className="type-card-title tracking-[0.2em] text-text-muted"
            >
              ••••••
            </motion.span>
          )}
        </AnimatePresence>

        {/* The accessible name says what is hidden; the masked dots above are decorative. */}
        <button
          type="button"
          onClick={() => setRevealed((current) => !current)}
          aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="ml-2 flex size-9 items-center justify-center rounded-card text-text-muted transition-colors duration-150 hover:bg-background hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
        >
          {revealed ? (
            <EyeOff className="size-4" aria-hidden strokeWidth={2} />
          ) : (
            <Eye className="size-4" aria-hidden strokeWidth={2} />
          )}
        </button>

        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="flex size-9 items-center justify-center rounded-card text-text-muted transition-colors duration-150 hover:bg-background hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
        >
          {copied ? (
            <Check className="size-4 text-emerald" aria-hidden strokeWidth={2.5} />
          ) : (
            <Copy className="size-4" aria-hidden strokeWidth={2} />
          )}
        </button>

        {/* Announced once per copy, without moving anything on screen. */}
        <span aria-live="polite" className="sr-only">
          {copied ? `${label} copied` : ""}
        </span>
      </div>
    </div>
  );
}
