"use client";

import { Landmark, PiggyBank, Receipt, Scale } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { CapacityMeter } from "./capacity-meter";
import { KpiCardGrid, type KpiCard } from "./kpi-card-grid";
import type { TrendPoint } from "./trend-indicator";
import type { Capacity } from "@/lib/eligibility";

/**
 * The employee Dashboard KPI row — employee blueprint 4.1.
 *
 * The interaction lives in KpiCardGrid, which the cooperative dashboard uses too; this file is
 * only the four cards an employee sees and what each of them means.
 *
 * Colour carries meaning rather than decoration, one semantic tone per card as
 * docs/planning/clarix-design-system.md § 4 specifies: savings emerald, loans indigo, deductions
 * navy, capacity emerald when healthy and amber when tight.
 *
 * Available Capacity is the only card that expands into the meter, because it is the only one
 * that is a number against a limit. There is deliberately no second way of drawing
 * used-versus-available anywhere here; the sparkline answers a different question (which way has
 * this been moving) and never compares a value to a ceiling.
 */
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
  const tight = capacity.cap > 0 && capacity.available / capacity.cap < 0.15;

  const cards: KpiCard[] = [
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
      trend: { points: savingsTrend, emptyLabel: "No history yet" },
    },
    {
      key: "loans",
      label: "Active loans",
      icon: (props) => <Receipt {...props} />,
      value: activeLoanCount,
      format: "count",
      accent: "var(--clarix-brand-secondary)",
      detail:
        "Loans recorded on Clarix, across every cooperative, that are still being repaid.",
    },
    {
      key: "deductions",
      label: "Monthly deductions",
      icon: (props) => <Landmark {...props} />,
      value: monthlyDeductions,
      accent: "var(--clarix-brand-primary)",
      detail: "What your cooperatives take from your salary each month in total.",
      trend: { points: [], emptyLabel: "No history yet" },
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
      expanded:
        salaryConfirmed ? (
          <CapacityMeter
            showHeadline={false}
            cap={capacity.cap}
            committed={capacity.committed}
            caption="Your monthly deduction limit, and what is still free of it."
          />
        ) : null,
    },
  ];

  return <KpiCardGrid cards={cards} />;
}
