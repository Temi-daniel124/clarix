import { createClient } from "@/lib/supabase/server";

/**
 * Reports (admin blueprint 7.6).
 *
 * The blueprint is deliberately short here, and names exactly three views: "member growth over
 * time, total savings held, reconciliation shortfall trend", each "a simple chart-plus-table page
 * rather than a configurable report-builder". That is what this file reads, and nothing more. No
 * date-range picker, no grouping, no export: those are all reasonable later, and inventing them
 * now would be building past what was asked for.
 *
 * Every read here goes through the ordinary authenticated client and is scoped by policies that
 * already existed: `cooperative_memberships_select_staff`, `savings_transactions_select_staff` and
 * `deduction_reconciliation_select_staff`. A report is a different arrangement of rows this staff
 * member could already open one at a time, so it needed no new grant and was given none.
 *
 * One of the three has no data yet, and says so rather than drawing an empty chart as though it
 * were a flat trend. `deduction_reconciliation` has never been written to, because nothing has
 * been reconciled against a real payroll file.
 */

export type Period = {
  /** First day of the month, ISO. */
  month: string;
  label: string;
};

export type SeriesPoint = Period & { value: number };

function monthKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function monthLabel(month: string): string {
  return new Date(month).toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

/**
 * Every month from the first with data to this one, so a month in which nothing happened reads as
 * a flat stretch rather than disappearing and making the line look continuous.
 */
function monthsBetween(firstIso: string, lastIso: string): string[] {
  const months: string[] = [];
  const cursor = new Date(firstIso);
  const end = new Date(lastIso);

  while (cursor <= end) {
    months.push(
      `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-01`,
    );
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}

/** Member growth over time: how many people joined each month, and the running total. */
export async function loadMemberGrowth(cooperativeId: string): Promise<{
  joinedPerMonth: SeriesPoint[];
  runningTotal: SeriesPoint[];
  total: number;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cooperative_memberships")
    .select("joined_at")
    .eq("cooperative_id", cooperativeId)
    .eq("status", "active")
    .not("joined_at", "is", null)
    .order("joined_at");

  const rows = data ?? [];
  if (rows.length === 0) return { joinedPerMonth: [], runningTotal: [], total: 0 };

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.joined_at) continue;
    const key = monthKey(row.joined_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const months = monthsBetween(
    monthKey(rows[0].joined_at as string),
    new Date().toISOString(),
  );

  let running = 0;
  const joinedPerMonth: SeriesPoint[] = [];
  const runningTotal: SeriesPoint[] = [];

  for (const month of months) {
    const joined = counts.get(month) ?? 0;
    running += joined;
    joinedPerMonth.push({ month, label: monthLabel(month), value: joined });
    runningTotal.push({ month, label: monthLabel(month), value: running });
  }

  return { joinedPerMonth, runningTotal, total: running };
}

/**
 * Total savings held, month by month.
 *
 * Built from the ledger rather than from `savings_balance`, which holds only today's figure. The
 * running total applies the same rule the balance trigger does: contributions add, recorded
 * withdrawals subtract, and a loan repayment is neither.
 */
export async function loadSavingsHeld(cooperativeId: string): Promise<{
  series: SeriesPoint[];
  held: number;
  contributions: number;
  withdrawals: number;
}> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("cooperative_memberships")
    .select("id")
    .eq("cooperative_id", cooperativeId);

  const ids = (memberships ?? []).map((row) => row.id);
  if (ids.length === 0) {
    return { series: [], held: 0, contributions: 0, withdrawals: 0 };
  }

  const { data } = await supabase
    .from("savings_transactions")
    .select("type, amount, recorded_at")
    .in("membership_id", ids)
    .in("type", ["contribution", "withdrawal_record"])
    .order("recorded_at");

  const rows = data ?? [];
  if (rows.length === 0) return { series: [], held: 0, contributions: 0, withdrawals: 0 };

  const movement = new Map<string, number>();
  let contributions = 0;
  let withdrawals = 0;

  for (const row of rows) {
    const amount = Number(row.amount);
    const signed = row.type === "contribution" ? amount : -amount;
    if (row.type === "contribution") contributions += amount;
    else withdrawals += amount;

    const key = monthKey(row.recorded_at);
    movement.set(key, (movement.get(key) ?? 0) + signed);
  }

  const months = monthsBetween(monthKey(rows[0].recorded_at), new Date().toISOString());

  let running = 0;
  const series: SeriesPoint[] = months.map((month) => {
    running += movement.get(month) ?? 0;
    return { month, label: monthLabel(month), value: Math.max(running, 0) };
  });

  return { series, held: Math.max(running, 0), contributions, withdrawals };
}

export type ShortfallRow = {
  period: string;
  label: string;
  expected: number;
  received: number;
  shortfall: number;
  members: number;
};

/**
 * Reconciliation shortfall trend: what payroll was expected to deduct against what arrived.
 *
 * The shortfall is derived rather than stored (docs/DATA-MODEL.md), so it is computed here from
 * the two figures that are. A period nobody has entered an actual for yet is left out of the
 * trend entirely rather than counted as a total shortfall, which would read as payroll having
 * sent nothing.
 */
export async function loadShortfallTrend(cooperativeId: string): Promise<ShortfallRow[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("cooperative_memberships")
    .select("id")
    .eq("cooperative_id", cooperativeId);

  const ids = (memberships ?? []).map((row) => row.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("deduction_reconciliation")
    .select("period, expected_amount, actual_amount_received")
    .in("membership_id", ids)
    .not("actual_amount_received", "is", null)
    .order("period");

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const byPeriod = new Map<string, { expected: number; received: number; members: number }>();

  for (const row of rows) {
    const current = byPeriod.get(row.period) ?? { expected: 0, received: 0, members: 0 };
    byPeriod.set(row.period, {
      expected: current.expected + Number(row.expected_amount),
      received: current.received + Number(row.actual_amount_received ?? 0),
      members: current.members + 1,
    });
  }

  return [...byPeriod.entries()].map(([period, totals]) => ({
    period,
    label: monthLabel(period),
    expected: totals.expected,
    received: totals.received,
    shortfall: Math.max(totals.expected - totals.received, 0),
    members: totals.members,
  }));
}
