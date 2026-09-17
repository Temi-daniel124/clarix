import { createClient } from "@/lib/supabase/server";
import type { Capacity } from "@/lib/eligibility";

export type LoanStatus =
  | "draft"
  | "reserved"
  | "active"
  | "rejected"
  | "completed"
  | "expired";

export type LoanSummary = {
  id: string;
  membershipId: string;
  cooperativeId: string;
  cooperativeName: string;
  requestedAmount: number;
  monthlyRepayment: number;
  tenureMonths: number;
  status: LoanStatus;
  repaid: number;
  remaining: number;
  /** 0–1. What share of the principal has been repaid. */
  progress: number;
  reservedAt: string | null;
  reservationExpiresAt: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  nextRepaymentOn: string | null;
};

export type LedgerEntry = {
  id: string;
  type: "contribution" | "withdrawal_record" | "loan_repayment";
  amount: number;
  description: string | null;
  recordedAt: string;
  loanId: string | null;
};

/**
 * Capacity straight from the database (Step 1 / Step 2 of docs/DATA-MODEL.md).
 *
 * This deliberately calls `capacity_for_user` rather than summing loans in TypeScript. The sum
 * has to cross every cooperative the employee belongs to, and per-cooperative RLS correctly
 * refuses that to a normal query: the SECURITY DEFINER function is the sanctioned narrow
 * exception (DECISIONS.md D003). `src/lib/eligibility.ts` still owns the arithmetic and is what
 * the unit tests cover; this is the same formula executed where the data is legible.
 */
export async function loadCapacity(proposedMonthlyRepayment = 0): Promise<Capacity | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("capacity_for_user", {
    proposed_monthly_repayment: proposedMonthlyRepayment,
  });

  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return {
    cap: Number(row.cap),
    committed: Number(row.committed),
    available: Number(row.available),
  };
}

/**
 * Every loan the employee holds, across every cooperative, with repayment progress.
 *
 * Progress comes from the ledger rather than from elapsed time: what has actually been recorded
 * as repaid, not what should have been by now. Clarix records deductions that happened; assuming
 * a repayment landed because a month passed would be exactly the kind of convenient fiction this
 * product is built to avoid.
 */
export async function loadLoans(): Promise<LoanSummary[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("cooperative_memberships")
    .select("id, cooperative_id, cooperatives(name)")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) return [];

  const membershipIds = memberships.map((row) => row.id);

  const [{ data: loans }, { data: repayments }] = await Promise.all([
    supabase
      .from("loans")
      .select(
        "id, membership_id, requested_amount, monthly_repayment, tenure_months, status, reserved_at, reservation_expires_at, approved_at, completed_at, created_at",
      )
      .in("membership_id", membershipIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("savings_transactions")
      .select("loan_id, amount, recorded_at")
      .in("membership_id", membershipIds)
      .eq("type", "loan_repayment"),
  ]);

  const repaidByLoan = new Map<string, number>();
  const lastRepaymentByLoan = new Map<string, string>();

  for (const row of repayments ?? []) {
    if (!row.loan_id) continue;
    repaidByLoan.set(row.loan_id, (repaidByLoan.get(row.loan_id) ?? 0) + Number(row.amount));
    const seen = lastRepaymentByLoan.get(row.loan_id);
    if (!seen || row.recorded_at > seen) lastRepaymentByLoan.set(row.loan_id, row.recorded_at);
  }

  const membershipById = new Map(
    memberships.map((row) => {
      const cooperative = Array.isArray(row.cooperatives) ? row.cooperatives[0] : row.cooperatives;
      return [row.id, { cooperativeId: row.cooperative_id, name: cooperative?.name ?? "Cooperative" }];
    }),
  );

  return (loans ?? []).map((loan) => {
    const requested = Number(loan.requested_amount);
    const repaid = Math.min(repaidByLoan.get(loan.id) ?? 0, requested);
    const membership = membershipById.get(loan.membership_id);

    return {
      id: loan.id,
      membershipId: loan.membership_id,
      cooperativeId: membership?.cooperativeId ?? "",
      cooperativeName: membership?.name ?? "Cooperative",
      requestedAmount: requested,
      monthlyRepayment: Number(loan.monthly_repayment),
      tenureMonths: loan.tenure_months,
      status: loan.status,
      repaid,
      remaining: Math.max(0, requested - repaid),
      progress: requested > 0 ? Math.min(1, repaid / requested) : 0,
      reservedAt: loan.reserved_at,
      reservationExpiresAt: loan.reservation_expires_at,
      approvedAt: loan.approved_at,
      completedAt: loan.completed_at,
      createdAt: loan.created_at,
      nextRepaymentOn:
        loan.status === "active"
          ? nextMonthAfter(lastRepaymentByLoan.get(loan.id) ?? loan.approved_at)
          : null,
    };
  });
}

/** The ledger for one membership, newest first. */
export async function loadLedger(membershipId: string): Promise<LedgerEntry[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("savings_transactions")
    .select("id, type, amount, description, recorded_at, loan_id")
    .eq("membership_id", membershipId)
    .order("recorded_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    recordedAt: row.recorded_at,
    loanId: row.loan_id,
  }));
}

/**
 * When the next deduction is expected: one month after the last one recorded.
 *
 * Presented as an expectation, never as a fact. Clarix has no payroll connection (D005) and
 * cannot know a deduction happened until a cooperative records it.
 */
function nextMonthAfter(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}
