"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { CapacityMeter } from "./capacity-meter";

/**
 * The landing page's hero visual, and a slower version of the same thing on the auth panel.
 *
 * DESIGN_SYSTEM.md is explicit that the hero must be a real, simplified working preview of the
 * product rather than an illustration of a metaphor for it, so this is the actual eligibility
 * check, running the actual arithmetic from docs/DATA-MODEL.md § Step 1/Step 2, on a loop:
 *
 *     cap       = gross salary x the organization's maximum deduction percentage
 *     committed = monthly repayments already reserved or active, across every cooperative
 *     available = cap - committed
 *
 * The figures are illustrative rather than anyone's real payslip, and the caption says so.
 * No cooperative is named: the preview shows the aggregate, which is exactly the minimum the
 * formula needs and all Clarix ever discloses across cooperatives (DECISIONS.md D003).
 */

const SALARY_GROSS = 250_000;
const MAX_PERCENTAGE = 33.3;
const CAP = Math.round((SALARY_GROSS * MAX_PERCENTAGE) / 100);

type Frame = {
  committed: number;
  proposed: number;
  note: string;
};

const FRAMES: Frame[] = [
  { committed: 0, proposed: 0, note: "Reading salary basis from the confirmed payslip" },
  { committed: 54_000, proposed: 0, note: "Adding obligations from every cooperative" },
  { committed: 54_000, proposed: 18_000, note: "Checking a request of ₦18,000 a month" },
  { committed: 54_000, proposed: 34_000, note: "Checking a request of ₦34,000 a month" },
];

export function EligibilityPreview({
  pace = "hero",
  className,
}: {
  /** "hero" on the landing page; "calm" is the subtler, slower auth-panel variant. */
  pace?: "hero" | "calm";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;

    const interval = pace === "hero" ? 2600 : 4200;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % FRAMES.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [pace, reduceMotion]);

  // Reduced motion holds the frame that carries the most meaning: a real request being
  // checked against real remaining capacity, rather than looping through the others.
  const frame = reduceMotion ? FRAMES[2] : FRAMES[index];

  return (
    <div
      className={cn(
        "w-full rounded-feature border border-border bg-surface p-6 md:p-8",
        // The hero variant always sits on the fixed navy ground, so it holds the light palette
        // in both themes, see the .theme-light note in globals.css.
        pace === "hero" && "theme-light",
        pace === "calm" && "border-white/10 bg-white/[0.04]",
        className,
      )}
      style={pace === "hero" ? { boxShadow: "var(--shadow-elevation)" } : undefined}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p
            className={cn(
              "type-caption uppercase tracking-[0.08em]",
              pace === "calm" ? "text-white/45" : "text-text-muted",
            )}
          >
            Eligibility check
          </p>
          <p
            className={cn(
              "type-card-title mt-1",
              pace === "calm" ? "text-white" : "text-text",
            )}
          >
            One salary, every cooperative
          </p>
        </div>

        <CooperativeCount count={frame.committed > 0 ? 3 : 0} calm={pace === "calm"} />
      </div>

      <div
        className={cn(
          "mt-6 rounded-card border p-5",
          pace === "calm" ? "border-white/10 bg-white/[0.03]" : "border-border bg-background",
        )}
      >
        <CapacityMeter
          cap={CAP}
          committed={frame.committed}
          proposed={frame.proposed}
          showVerdict={frame.proposed > 0}
          caption={`Illustrative figures: ${formatNaira(SALARY_GROSS)} gross, capped at ${MAX_PERCENTAGE}% of gross pay.`}
        />
      </div>

      {/*
        The caption must never describe a different frame from the one the meter is drawing.
        An AnimatePresence with mode="wait" held the outgoing caption on screen until its exit
        finished, so the text lagged a frame behind the figures, on a product whose whole
        promise is telling the truth about a number, a caption disagreeing with the meter is
        exactly the wrong bug to ship. Keying a single element makes React swap it in the same
        commit as the meter, so the two can never disagree.
      */}
      <div className="mt-4 min-h-[20px]">
        <motion.p
          key={frame.note}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : springStandard}
          className={cn("type-caption", pace === "calm" ? "text-white/50" : "text-text-secondary")}
        >
          {frame.note}
        </motion.p>
      </div>
    </div>
  );
}

function CooperativeCount({ count, calm }: { count: number; calm: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 type-caption",
        calm ? "border-white/12 text-white/70" : "border-border text-text-secondary",
      )}
    >
      <Building2 className="size-3.5" aria-hidden strokeWidth={2} />
      {count} cooperatives
    </span>
  );
}
