import type { TrendPoint } from "@/components/clarix/trend-indicator";

/**
 * Month-end savings balance, oldest first, for the sparkline.
 *
 * Only contributions and recorded withdrawals move a savings balance: a loan repayment leaves
 * the salary and does not add to savings, so it is excluded. Fewer than two months of history
 * returns nothing, and the card shows its honest empty state rather than a single flat point.
 */
export function buildSavingsTrend(
  ledger: Array<{ amount: number | string; type: string; recorded_at: string }>,
  currentBalance: number,
): TrendPoint[] {
  const savings = ledger.filter(
    (row) => row.type === "contribution" || row.type === "withdrawal_record",
  );

  // Net movement per calendar month.
  const netByMonth = new Map<string, number>();
  for (const row of savings) {
    const month = row.recorded_at.slice(0, 7);
    const signed = row.type === "contribution" ? Number(row.amount) : -Number(row.amount);
    netByMonth.set(month, (netByMonth.get(month) ?? 0) + signed);
  }
  const months = [...netByMonth.keys()].sort();
  if (months.length < 2) return [];

  // Walk back from today's balance, so the last point IS the figure on the card and the change
  // shown is what really moved over these months (walkthrough 1.4d item 2). Building up from zero
  // left out any opening balance a cooperative imported, and the "change" could exceed the total.
  const points: TrendPoint[] = [];
  let balance = currentBalance;
  for (let index = months.length - 1; index >= 0; index -= 1) {
    points.unshift({ at: months[index], value: balance });
    balance -= netByMonth.get(months[index]) ?? 0;
  }
  return points;
}

