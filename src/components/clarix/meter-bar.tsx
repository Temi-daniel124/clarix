"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { clampRatio } from "@/lib/format";
import { springStandard } from "@/lib/motion";

export type MeterTone = "healthy" | "tight" | "exceeded";

/**
 * The other half of Clarix's signature motif (DESIGN_SYSTEM.md § The signature motif).
 *
 * A single horizontal fill showing what is already committed against the deduction cap, the
 * remainder reading as available capacity. This is the ONLY way Clarix ever draws "a number
 * relative to a limit": no second pattern may appear anywhere in the product.
 *
 * How an over-cap request is drawn, which is the whole difficulty of this component: a request
 * that exceeds the cap cannot simply be appended to the track, because the three segments would
 * then sum past 100% and flex would quietly shrink all of them: the committed segment would
 * stop being proportionally true, which on this product is a correctness bug, not a cosmetic
 * one. Instead the track rescales to the new total and a cap marker is drawn at the limit, so
 * the bar visibly runs PAST a marked line. Every segment stays honest about its own share.
 */
export function MeterBar({
  usedRatio,
  proposedRatio = 0,
  tone = "healthy",
  size = "default",
  track = "capacity",
  className,
  label,
}: {
  /** Already-committed obligations as a fraction of the cap. */
  usedRatio: number;
  /** A hypothetical additional amount being previewed, as a fraction of the cap. */
  proposedRatio?: number;
  tone?: MeterTone;
  size?: "default" | "compact";
  /**
   * What the unfilled remainder MEANS, which decides its colour.
   *
   * "capacity" tints the track emerald, because on a deduction meter the empty part is real
   * available headroom, something good that is genuinely there. "neutral" is for meters where
   * the remainder is merely unachieved rather than available (password strength): an
   * emerald-tinted empty track there reads as a full, healthy bar before anything is typed,
   * which is the opposite of the truth.
   */
  track?: "capacity" | "neutral";
  className?: string;
  label?: string;
}) {
  const reduceMotion = useReducedMotion();

  const used = Math.max(0, usedRatio);
  const proposed = Math.max(0, proposedRatio);
  const total = used + proposed;

  // When the total runs past the cap, the track represents the total instead of the cap, and
  // the cap itself becomes a marked line the fill overshoots.
  const scale = Math.max(1, total);
  const exceedsCap = total > 1;

  const committedWidth = clampRatio(used / scale);
  const withinCapWidth = clampRatio(Math.max(0, Math.min(proposed, 1 - used)) / scale);
  const overCapWidth = clampRatio(Math.max(0, total - 1) / scale);
  const capMarkerLeft = clampRatio(1 / scale);

  const transition = reduceMotion ? { duration: 0 } : springStandard;

  // DESIGN_SYSTEM §3, on a capacity meter: committed `ink-300`, what is still available
  // `emerald-500` (the track itself), `amber-500` once it is within 10% of the limit, and
  // whatever runs past the limit `red-500`. A previewed request that fits is `ink-500`: it is
  // about to join what is committed, so it sits in the same grey family, a step darker.
  // A neutral track (repayment progress, setup steps, password strength) is not a limit: its
  // fill keeps the brand ink on a hairline track.
  const capacity = track === "capacity";
  const committedFill = capacity ? "var(--clarix-ink-300)" : "var(--clarix-brand-primary)";
  // Past the limit, only the overflow is red (§3); the part of the request that still fits stays ink-500.
  const requestFill = capacity
    ? "var(--clarix-ink-500)"
    : tone === "exceeded"
      ? "var(--clarix-danger)"
      : tone === "tight"
        ? "var(--clarix-warning)"
        : "var(--clarix-brand-accent)";
  const trackFill = capacity
    ? tone === "tight"
      ? "var(--clarix-amber-500)"
      : "var(--clarix-emerald-500)"
    : "var(--clarix-border)";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        // §3: 8px on phones, 10px from 768px; the compact meter inside lists is 8px everywhere.
        size === "compact" ? "h-2" : "h-2 md:h-2.5",
        className,
      )}
      style={{ backgroundColor: trackFill }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(total, 1) * 100)}
      aria-label={label ?? "Share of the deduction cap already committed"}
    >
      <div className="absolute inset-0 flex">
        {/* Committed. */}
        <motion.div
          className="h-full shrink-0"
          style={{ backgroundColor: committedFill }}
          animate={{ width: `${committedWidth * 100}%` }}
          transition={transition}
        />

        {/* The part of this request that still fits inside the cap. */}
        <motion.div
          className="h-full shrink-0"
          style={{ backgroundColor: requestFill }}
          animate={{ width: `${withinCapWidth * 100}%` }}
          transition={transition}
        />

        {/* The part that runs past the cap, hatched so it reads as a warning rather than fill. */}
        <motion.div
          className="h-full shrink-0"
          style={{
            backgroundColor: "var(--clarix-red-500)",
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.28) 0 3px, transparent 3px 7px)",
          }}
          animate={{ width: `${overCapWidth * 100}%` }}
          transition={transition}
        />
      </div>

      {/* The cap line. Only drawn once the fill has something to overshoot. */}
      {exceedsCap ? (
        <motion.div
          aria-hidden
          className="absolute inset-y-0 w-[2px] rounded-full"
          style={{ backgroundColor: "var(--clarix-surface)" }}
          animate={{ left: `calc(${capMarkerLeft * 100}% - 1px)` }}
          transition={transition}
        />
      ) : null}
    </div>
  );
}
