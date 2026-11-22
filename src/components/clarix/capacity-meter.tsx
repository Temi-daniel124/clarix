"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { MeterBar, type MeterTone } from "./meter-bar";
import { RollingNumber } from "./rolling-number";

/**
 * The signature motif assembled: a rolling figure sitting above the used-vs-available meter.
 *
 * This is the component every screen reaches for when it shows a number against the deduction
 * cap: the employee dashboard's available capacity, the loan application's live preview, the
 * cooperative admin's KPI cards, the staff-side eligibility panel. Deliberately identical on
 * both sides of a loan decision: employee and officer see the same picture of the same number,
 * which is itself the trust signal (docs/planning/clarix-design-system.md § 6).
 */
export function CapacityMeter({
  cap,
  committed,
  proposed = 0,
  caption,
  showVerdict = false,
  showHeadline = true,
  className,
}: {
  /** The deduction ceiling: salary basis × the organization's maximum percentage. */
  cap: number;
  /** Monthly obligations already reserved or active, summed across every cooperative. */
  committed: number;
  /** A monthly repayment being previewed. Read-only, previewing never reserves anything. */
  proposed?: number;
  caption?: string;
  showVerdict?: boolean;
  /**
   * Set false when the surrounding card already states the label and the figure: the KPI
   * card does, and rendering them again made "Available capacity" and the amount appear twice
   * in the same card. The meter, its legend and its caption still render.
   */
  showHeadline?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  const available = Math.max(0, cap - committed);
  const shortfall = Math.max(0, proposed - available);
  const eligible = shortfall === 0;

  const usedRatio = cap > 0 ? committed / cap : 0;
  const proposedRatio = cap > 0 ? proposed / cap : 0;

  const tone: MeterTone = !eligible
    ? "exceeded"
    : available / (cap || 1) < 0.15
      ? "tight"
      : "healthy";

  const headlineValue = proposed > 0 && !eligible ? shortfall : available;
  const headlineLabel =
    proposed > 0 && !eligible ? "Exceeds available capacity by" : "Available capacity";

  return (
    <div className={cn("w-full", className)}>
      {showHeadline ? (
        <>
          <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
            {headlineLabel}
          </p>

          <div className="mt-2 flex items-baseline gap-3">
            <RollingNumber
              value={headlineValue}
              className={cn("type-kpi", !eligible && proposed > 0 ? "text-danger" : "text-text")}
            />
            {showVerdict ? (
              <Verdict eligible={eligible} reduceMotion={Boolean(reduceMotion)} />
            ) : null}
          </div>
        </>
      ) : null}

      <MeterBar
        className={showHeadline ? "mt-4" : ""}
        usedRatio={usedRatio}
        proposedRatio={proposedRatio}
        tone={tone}
        label="Committed monthly deductions against the agreed cap"
      />

      <dl className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1">
        <Legend swatch="var(--color-indigo-600)" term="Committed" value={committed} />
        {proposed > 0 ? (
          <Legend
            swatch={eligible ? "var(--color-ochre-500)" : "var(--color-red-600)"}
            term="This request"
            value={proposed}
          />
        ) : null}
        <Legend
          swatch="var(--color-emerald-500)"
          // With a request in view, the headline is the room before it; this is the room after.
          term={proposed > 0 ? "Left after this request" : "Still available"}
          value={Math.max(0, cap - committed - proposed)}
        />
        <Legend swatch="transparent" term="Monthly cap" value={cap} />
      </dl>

      {caption ? <p className="type-caption mt-3 text-text-muted">{caption}</p> : null}
    </div>
  );
}

function Legend({ swatch, term, value }: { swatch: string; term: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full border"
        style={{
          backgroundColor: swatch,
          borderColor: swatch === "transparent" ? "var(--clarix-text-muted)" : swatch,
        }}
      />
      <dt className="type-caption text-text-secondary">{term}</dt>
      <dd className="type-caption tabular text-text">{formatNaira(value)}</dd>
    </div>
  );
}

function Verdict({ eligible, reduceMotion }: { eligible: boolean; reduceMotion: boolean }) {
  const Icon = eligible ? Check : TriangleAlert;

  return (
    <motion.span
      key={eligible ? "eligible" : "not-eligible"}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : springStandard}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 type-caption",
        eligible
          ? "border-emerald/30 text-emerald"
          : "border-danger/30 text-danger",
      )}
      style={{
        backgroundColor: eligible
          ? "color-mix(in srgb, var(--clarix-brand-accent) 10%, transparent)"
          : "color-mix(in srgb, var(--clarix-danger) 10%, transparent)",
      }}
    >
      <Icon className="size-3.5" aria-hidden strokeWidth={2.5} />
      {eligible ? "Eligible" : "Not eligible"}
    </motion.span>
  );
}
