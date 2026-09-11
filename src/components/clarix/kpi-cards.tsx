"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Landmark, PiggyBank, Receipt, Scale, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { CapacityMeter } from "./capacity-meter";
import { RollingNumber } from "./rolling-number";
import type { Capacity } from "@/lib/eligibility";

/**
 * The Dashboard KPI row — blueprint 4.1.
 *
 * The tap-to-expand pattern the blueprint asks for, adapted from the Watermelon Minimal Carousel
 * whose interaction is a good fit but whose bright purple/cyan/blue look is exactly the "crypto
 * wallet" aesthetic docs/planning/clarix-design-system.md § 4 says to avoid. Collapsed, the four
 * sit in a row (a 2x2 grid on narrow widths). Tapping one expands it in place and the other
 * three shrink rather than disappearing, so you can move between them without leaving the
 * dashboard.
 *
 * Colour carries meaning rather than decoration, one semantic tone per card as that same section
 * specifies: savings emerald, loans indigo, deductions navy, capacity emerald when healthy and
 * amber when tight.
 *
 * Available Capacity is the only card that expands into the meter, because it is the only one
 * that is a number against a limit. The others expand into their own figure and a line of
 * context. There is deliberately no second way of drawing used-versus-available anywhere here.
 */

type CardKey = "savings" | "loans" | "deductions" | "capacity";

type CardSpec = {
  key: CardKey;
  label: string;
  icon: (props: LucideProps) => React.ReactNode;
  value: number;
  accent: string;
  detail: string;
};

export function KpiCards({
  totalSavings,
  activeLoanCount,
  monthlyDeductions,
  capacity,
  salaryConfirmed,
}: {
  totalSavings: number;
  activeLoanCount: number;
  monthlyDeductions: number;
  capacity: Capacity;
  salaryConfirmed: boolean;
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
        const somethingExpanded = expanded !== null;

        return (
          <motion.button
            key={card.key}
            type="button"
            layout={!reduceMotion}
            transition={reduceMotion ? { duration: 0 } : springStandard}
            onClick={() => setExpanded(isExpanded ? null : card.key)}
            aria-expanded={isExpanded}
            className={cn(
              "rounded-card border border-border bg-surface p-4 text-left md:p-5",
              "transition-colors duration-150 hover:border-text-muted/40",
              "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
              // The expanded card takes the full row; the rest compress alongside it.
              isExpanded && "col-span-2 lg:col-span-4",
              somethingExpanded && !isExpanded && "lg:col-span-1",
            )}
          >
            {/* min-h holds two lines of caption: "Monthly deductions" wraps at these card
                widths and "Total savings" does not, and without this the four figures below
                stopped sharing a baseline. */}
            <motion.span
              layout={!reduceMotion}
              className="flex min-h-[34px] items-start gap-2.5"
            >
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
            </motion.span>

            <motion.div layout={!reduceMotion} className="mt-3">
              {card.key === "loans" ? (
                <span className="type-kpi tabular text-text">{card.value}</span>
              ) : (
                <RollingNumber value={card.value} className="type-kpi text-text" />
              )}
            </motion.div>

            <AnimatePresence initial={false}>
              {isExpanded ? (
                <motion.div
                  key="detail"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={reduceMotion ? { duration: 0 } : springStandard}
                  className="overflow-hidden"
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
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
