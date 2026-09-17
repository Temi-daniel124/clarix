import { createClient } from "@/lib/supabase/server";

/**
 * Monthly Reconciliation (admin blueprint 7.5).
 *
 * "Make a deduction shortfall visible on purpose rather than discovered by accident." Every
 * member with something expected of them this month, what Clarix expected, and what the
 * cooperative says actually arrived.
 */

export type ReconciliationRow = {
  membershipId: string;
  memberName: string | null;
  employeeId: string | null;
  /** The sum of this member's active monthly repayments at this cooperative. */
  expected: number;
  /** Null until somebody enters it, which is different from zero, and shown differently. */
  actual: number | null;
  enteredAt: string | null;
};

export type ReconciliationPeriod = {
  period: string;
  label: string;
  rows: ReconciliationRow[];
  expectedTotal: number;
  receivedTotal: number;
  shortfallTotal: number;
  entered: number;
};

/** The last twelve months, newest first: the range a cooperative would realistically enter. */
export function recentPeriods(count = 12): { period: string; label: string }[] {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    return {
      period,
      label: new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(date),
    };
  });
}

export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

export async function loadReconciliation(
  cooperativeId: string,
  period: string,
): Promise<ReconciliationPeriod> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("cooperative_memberships")
    .select("id, users(name, employee_id)")
    .eq("cooperative_id", cooperativeId);

  const membershipIds = (memberships ?? []).map((row) => row.id);

  const [{ data: loans }, { data: entries }] = await Promise.all([
    membershipIds.length > 0
      ? supabase
          .from("loans")
          .select("membership_id, monthly_repayment, status")
          .in("membership_id", membershipIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] as never[] }),
    membershipIds.length > 0
      ? supabase
          .from("deduction_reconciliation")
          .select("membership_id, expected_amount, actual_amount_received, entered_at")
          .eq("period", period)
          .in("membership_id", membershipIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const expectedByMembership = new Map<string, number>();
  for (const loan of loans ?? []) {
    expectedByMembership.set(
      loan.membership_id,
      (expectedByMembership.get(loan.membership_id) ?? 0) + Number(loan.monthly_repayment),
    );
  }

  const enteredByMembership = new Map<
    string,
    { expected: number; actual: number | null; enteredAt: string }
  >();
  for (const entry of entries ?? []) {
    enteredByMembership.set(entry.membership_id, {
      expected: Number(entry.expected_amount),
      actual: entry.actual_amount_received === null ? null : Number(entry.actual_amount_received),
      enteredAt: entry.entered_at,
    });
  }

  const rows: ReconciliationRow[] = (memberships ?? [])
    .map((membership) => {
      const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;
      const recorded = enteredByMembership.get(membership.id);

      return {
        membershipId: membership.id,
        memberName: person?.name ?? null,
        employeeId: person?.employee_id ?? null,
        // A row already entered keeps the figure that was expected AT THE TIME, which is the
        // point of recording it: a loan completed since must not rewrite last month's history.
        expected: recorded?.expected ?? expectedByMembership.get(membership.id) ?? 0,
        actual: recorded?.actual ?? null,
        enteredAt: recorded?.enteredAt ?? null,
      };
    })
    // Only members something is expected of, or where something was already entered. A member
    // with no active loan has nothing to reconcile and would be noise on a 400-row list.
    .filter((row) => row.expected > 0 || row.actual !== null)
    .sort((a, b) => (a.memberName ?? "~").localeCompare(b.memberName ?? "~"));

  const expectedTotal = rows.reduce((total, row) => total + row.expected, 0);
  const receivedTotal = rows.reduce((total, row) => total + (row.actual ?? 0), 0);
  const shortfallTotal = rows.reduce(
    (total, row) => total + (row.actual === null ? 0 : Math.max(row.expected - row.actual, 0)),
    0,
  );

  return {
    period,
    label: periodLabel(period),
    rows,
    expectedTotal,
    receivedTotal,
    shortfallTotal,
    entered: rows.filter((row) => row.actual !== null).length,
  };
}
