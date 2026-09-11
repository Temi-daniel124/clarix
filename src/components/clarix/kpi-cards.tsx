"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Landmark, PiggyBank, Receipt, Scale, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { CapacityMeter } from "./capacity-meter";
import { RollingNumber } from "./rolling-number";
import { TrendIndicator, type TrendPoint } from "./trend-indicator";
import type { Capacity } from "@/lib/eligibility";

/**
 * The Dashboard KPI row — blueprint 4.1.
 *
 * The tap-to-expand pattern the blueprint asks for, adapted from the Watermelon Minimal Carousel
 * whose interaction is a good fit but whose bright purple/cyan/blue look is exactly the "crypto
 * wallet" aesthetic docs/planning/clarix-design-system.md § 4 says to avoid. Collapsed, the four
 * sit in a row (a 2x2 grid on narrow widths). Tapping one expands it and the other three shrink
 * to make room rather than disappearing.
 *
 * Colour carries meaning rather than decoration, one semantic tone per card as that same section
 * specifies: savings emerald, loans indigo, deductions navy, capacity emerald when healthy and
 * amber when tight.
 *
 * Available Capacity is the only card that expands into the meter, because it is the only one
 * that is a number against a limit. There is deliberately no second way of drawing
 * used-versus-available anywhere here; the sparkline answers a different question (which way has
 * this been moving) and never compares a value to a ceiling.
 *
 * ---------------------------------------------------------------------------
 * On why this animation used to feel fast and bouncy, since re-tuning the spring would have
 * treated the symptom:
 *
 * A single tap was starting FOUR overlapping animation systems, not one.
 *
 *   1. `layout` on the card — which fires on all four cards, because changing one card's grid
 *      span moves and resizes every sibling.
 *   2. `layout` on the header row inside each card — a nested layout animation.
 *   3. `layout` on the figure inside each card — another nested one.
 *   4. An AnimatePresence height animation from 0 to auto on the detail, which fought the
 *      parent's `layout`: the parent was already animating the very size change the height
 *      animation was producing.
 *
 * So up to twelve layout animations plus a height animation resolved at once, each starting from
 * a different delta and therefore settling at a slightly different moment. The compounding is
 * what read as bouncy, not the spring's own 3.9% overshoot.
 *
 * The fix keeps the one standard spring and removes the competition: `layout` lives on the card
 * and nowhere else, the content wrapper uses `layout="position"` so text moves instead of
 * stretching during the resize, and the detail only fades — the card's own layout animation is
 * what changes its size.
 * ---------------------------------------------------------------------------
 */

type CardKey = "savings" | "loans" | "deductions" | "capacity";

type CardSpec = {
  key: CardKey;
  label: string;
  icon: (props: LucideProps) => React.ReactNode;
  value: number;
  accent: string;
  detail: string;
  /** Omitted for cards where movement over time is not a meaningful question. */
  trend?: { points: TrendPoint[]; emptyLabel: string };
};

export function KpiCards({
  totalSavings,
  activeLoanCount,
  monthlyDeductions,
  capacity,
  salaryConfirmed,
  savingsTrend,
}: {
  totalSavings: number;
  activeLoanCount: number;
  monthlyDeductions: number;
  capacity: Capacity;
  salaryConfirmed: boolean;
  savingsTrend: TrendPoint[];
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState<CardKey | null>(null);

  const tight = capacity.cap > 0 && capacity.available / capacity.cap < 0.15;

  const cards: CardSpec[] = [
    {
      key: "savings",
      label: "Total savings",
      icon: (props) => <PiggyBank {...props} />,
      value: totalSavings,
      accent: "var(--clarix-brand-accent)",
      detail:
        totalSavings > 0
          ? "Added up across every cooperative where your membership is active."
          : "Nothing recorded yet. Your savings appear here as each cooperative records them.",
      trend: {
        points: savingsTrend,
        emptyLabel: "No history yet",
      },
    },
    {
      key: "loans",
      label: "Active loans",
      icon: (props) => <Receipt {...props} />,
      value: activeLoanCount,
      accent: "var(--clarix-brand-secondary)",
      detail:
        "Loans recorded on Clarix, across every cooperative. Borrowing is not yet available in this build.",
    },
    {
      key: "deductions",
      label: "Monthly deductions",
      icon: (props) => <Landmark {...props} />,
      value: monthlyDeductions,
      accent: "var(--clarix-brand-primary)",
      detail:
        "What your cooperatives take from your salary each month in total. Nothing is committed yet.",
      trend: {
        points: [],
        emptyLabel: "No history yet",
      },
    },
    {
      key: "capacity",
      label: "Available capacity",
      icon: (props) => <Scale {...props} />,
      value: capacity.available,
      accent: tight ? "var(--clarix-warning)" : "var(--clarix-brand-accent)",
      detail: salaryConfirmed
        ? `Your agreed limit is ${formatNaira(capacity.cap)} a month. This is what is left of it.`
        : "Confirm your salary from a payslip and Clarix can work out your limit.",
    },
  ];

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
              "flex flex-col rounded-card border bg-surface p-4 text-left md:p-5",
              "transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
              /* `order-first` keeps the layout predictable. Without it, expanding a middle
                 card split the row around it — two cards above, the expanded one, then the
                 fourth stranded below — because a full-width grid item breaks the row wherever
                 it happens to sit. The expanded card now always rises to the top and the other
                 three stay together beneath it. */
              isExpanded
                ? "order-first col-span-2 border-text-muted/30 lg:col-span-4"
                : "border-border hover:border-text-muted/40",
            )}
          >
            {/* layout="position" moves this block without scaling it, which is what stops the
                label and figure from stretching while the card resizes. */}
            <motion.div layout={reduceMotion ? false : "position"}>
              <span className="flex min-h-[34px] items-start gap-2.5">
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

              <div className="mt-3">
                {card.key === "loans" ? (
                  <span className="type-kpi tabular text-text">{card.value}</span>
                ) : (
                  <RollingNumber value={card.value} className="type-kpi text-text" />
                )}
              </div>

              {card.trend ? (
                <TrendIndicator
                  className="mt-2"
                  points={card.trend.points}
                  emptyLabel={card.trend.emptyLabel}
                />
              ) : (
                /* Keeps every card's body the same height whether or not it carries a trend,
                   so the row does not look ragged. */
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
                {card.key === "capacity" && salaryConfirmed ? (
                  <div className="pt-5">
                    <CapacityMeter
                      showHeadline={false}
                      cap={capacity.cap}
                      committed={capacity.committed}
                      caption="Your monthly deduction limit, and what is still free of it."
                    />
                  </div>
                ) : null}

                <p className="type-secondary pt-4 text-text-secondary">{card.detail}</p>
              </motion.div>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
