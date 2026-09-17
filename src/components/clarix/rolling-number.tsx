"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatAmount, NAIRA } from "@/lib/format";
import { springRollingDigit } from "@/lib/motion";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Half of Clarix's signature motif (DESIGN_SYSTEM.md § The signature motif).
 *
 * Every financial figure that can change, savings balance, loan balance, available capacity, a
 * requested amount moving under a slider, renders through this component, so that a number
 * visibly rolls into place rather than sitting there like a screenshot.
 *
 * On the baseline, which is fiddly and was wrong the first time: an inline-block with
 * `overflow: hidden` takes its BOTTOM MARGIN EDGE as its baseline, not the baseline of the text
 * inside it. Clipping the digit column directly therefore dropped every digit relative to the ₦
 * sign and the thousands separators, and they visibly collided. So each column is now two
 * elements: an outer inline-block that does not clip and holds an invisible "0" purely to
 * establish the correct baseline and the correct tabular width, and an absolutely positioned
 * inner element that does the clipping and the rolling. Nothing here uses a magic em width.
 */
export function RollingNumber({
  value,
  prefix = NAIRA,
  className,
  ariaLabel,
}: {
  value: number;
  /** Defaults to the Naira sign. Pass "" for a bare figure. */
  prefix?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const formatted = formatAmount(value);
  const characters = formatted.split("");

  return (
    <span className={cn("inline-flex items-baseline tabular", className)}>
      {/* The figure as plain text for assistive technology; the rolling columns below are
          decorative duplicates of exactly this value. */}
      <span className="sr-only">{ariaLabel ?? `${prefix}${formatted}`}</span>

      <span aria-hidden className="inline-flex items-baseline">
        {prefix ? <span className="mr-[2px]">{prefix}</span> : null}

        {characters.map((character, index) => {
          // Key from the right so a digit keeps its identity as the figure grows or shrinks,
          // rather than every column remounting when a thousands separator appears.
          const keyFromRight = characters.length - index;

          if (character === ",") {
            return (
              <span key={`sep-${keyFromRight}`} className="px-[1px]">
                ,
              </span>
            );
          }

          return (
            <DigitColumn
              key={`digit-${keyFromRight}`}
              digit={Number(character)}
              reduceMotion={Boolean(reduceMotion)}
            />
          );
        })}
      </span>
    </span>
  );
}

function DigitColumn({ digit, reduceMotion }: { digit: number; reduceMotion: boolean }) {
  return (
    <span className="relative inline-block" style={{ lineHeight: 1 }}>
      {/* Invisible, but laid out: it sets this column's baseline and its tabular width. */}
      <span className="invisible" aria-hidden>
        0
      </span>

      <span className="absolute inset-0 overflow-hidden">
        <motion.span
          className="absolute inset-x-0 top-0 block"
          style={{ height: "1000%" }}
          animate={{ y: `${-digit * 10}%` }}
          transition={reduceMotion ? { duration: 0 } : springRollingDigit}
        >
          {DIGITS.map((d) => (
            <span
              key={d}
              className="flex h-[10%] w-full items-center justify-center"
              style={{ lineHeight: 1 }}
            >
              {d}
            </span>
          ))}
        </motion.span>
      </span>
    </span>
  );
}
