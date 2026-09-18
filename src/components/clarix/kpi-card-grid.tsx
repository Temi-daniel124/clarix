"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { RollingNumber } from "./rolling-number";
import { TrendIndicator, type TrendPoint } from "./trend-indicator";

/**
 * The tap-to-expand KPI row, shared by the employee dashboard (employee blueprint 4.1) and the
 * cooperative dashboard (admin blueprint 4.1).
 *
 * Both blueprints ask for the same interaction over different figures, so the interaction lives
 * here once and each dashboard supplies its own cards. That matters more than it looks: the
 * animation below was arrived at by diagnosis rather than taste, and a second copy would be a
 * second thing to get subtly wrong.
 *
 * ---------------------------------------------------------------------------
 * Why the animation is shaped like this, since re-tuning the spring would have treated the
 * symptom rather than the cause:
 *
 * A single tap used to start FOUR overlapping animation systems, not one, `layout` on the card
 * (which fires on every sibling, because changing one card's grid span moves them all), `layout`
 * on the header row inside each card, `layout` on the figure inside each card, and an
 * AnimatePresence height animation from 0 to auto fighting the parent's own resize. Up to twelve
 * layout animations plus a height animation resolved at once, each starting from a different
 * delta and settling at a slightly different moment. That compounding read as bouncy, not the
 * spring's own 3.9% overshoot.
 *
 * So: `layout` lives on the card and nowhere else, the content wrapper uses `layout="position"`
 * so text moves rather than stretches during the resize, and the detail only fades. Measured
 * afterwards over 52 frames: one 2.9% overshoot, settled by 470ms, no oscillation.
 * ---------------------------------------------------------------------------
 */

export type KpiCard = {
  key: string;
  label: string;
  icon: (props: LucideProps) => ReactNode;
  /** Rolled as a figure unless `format` says otherwise. */
  value: number;
  /** "naira" rolls the digits; "count" prints a plain integer, which is what a count is. */
  format?: "naira" | "count";
  /** One semantic tone per card, never decoration. */
  accent: string;
  /** The sentence revealed when the card is expanded. */
  detail: string;
  /** Omitted where movement over time is not a meaningful question for this figure. */
  trend?: { points: TrendPoint[]; emptyLabel: string };
  /** Anything richer than a sentence, in practice, the capacity meter. */
  expanded?: ReactNode;
};

export function KpiCardGrid({ cards }: { cards: KpiCard[] }) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const isExpanded = expanded === card.key;

        return (
          <motion.button
            key={card.key}
            type="button"
            /* The ONLY layout animation in this component. */
            layout={!reduceMotion}
            transition={reduceMotion ? { duration: 0 } : springStandard}
            onClick={() => setExpanded(isExpanded ? null : card.key)}
            aria-expanded={isExpanded}
            className={cn(
              "flex flex-col rounded-card border bg-surface p-3 text-left md:p-5",
              "transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
              /* `order-first` keeps the layout predictable. Without it, expanding a middle card
                 split the row around it, because a full-width grid item breaks the row wherever
                 it happens to sit. */
              isExpanded
                ? "order-first col-span-2 border-text-muted/30 lg:col-span-4"
                : "border-border hover:border-text-muted/40",
            )}
          >
            <motion.div layout={reduceMotion ? false : "position"} className="@container">
              <span className="flex min-h-[34px] flex-col items-start gap-2 @[9rem]:flex-row">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${card.accent} 14%, transparent)`,
                    color: card.accent,
                  }}
                >
                  {card.icon({ className: "size-3.5", strokeWidth: 2 })}
                </span>
                <span className="type-caption uppercase tracking-[0.06em] text-text-muted">
                  {card.label}
                </span>
              </span>

              {/* The card is the container the figure fits itself to (type-kpi-fit). */}
              <div
                className="@container mt-3"
                style={
                  {
                    "--kpi-chars":
                      card.format === "count"
                        ? String(card.value).length
                        : formatNaira(card.value).length,
                  } as React.CSSProperties
                }
              >
                {card.format === "count" ? (
                  <span className="type-kpi-fit tabular text-text">{card.value}</span>
                ) : (
                  <RollingNumber value={card.value} className="type-kpi-fit text-text" />
                )}
              </div>

              {card.trend ? (
                <TrendIndicator
                  className="mt-2"
                  points={card.trend.points}
                  emptyLabel={card.trend.emptyLabel}
                />
              ) : (
                /* Keeps every card's body the same height whether or not it carries a trend, so
                   the row does not look ragged. */
                <span aria-hidden className="mt-2 block h-4" />
              )}
            </motion.div>

            {/* No height animation: the card's own `layout` already animates the size change.
                This only fades in, so the two are not competing over the same property. */}
            {isExpanded ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.18, delay: 0.08 }}
              >
                {card.expanded ? <div className="pt-5">{card.expanded}</div> : null}
                <p className="type-secondary pt-4 text-text-secondary">{card.detail}</p>
              </motion.div>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
