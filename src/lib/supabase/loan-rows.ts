import type { createClient } from "@/lib/supabase/server";

/**
 * The one read of a member's loans (walkthrough 1.4d item 1). The member home, the member's Loans
 * screen and the cooperative's Members list and member page all load loan rows through this, and
 * all count them with `summariseLoans` (src/lib/loan-status.ts), so the three can never disagree
 * about how many loans someone has or what is committed.
 *
 * Why it exists: each screen used to write its own select. The member's named the columns that the
 * existing-loans migration (BUILD-PLAN 0.3) adds; on a deployment whose database does not have them
 * yet, that select failed, the error was swallowed, and the member was told they had no loans while
 * the cooperative's list, which selected fewer columns, showed two. Now a missing column is handled
 * and any other failure is thrown, never shown as "no loans".
 */

export type LoanRow = {
  id: string;
  membershipId: string;
  requestedAmount: number;
  monthlyRepayment: number;
  tenureMonths: number;
  status: string;
  reservedAt: string | null;
  reservationExpiresAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  /** "application", or "pre_existing" for a loan staff entered as already running (D036, 0.3). */
  origin: string;
  outstandingAtEntry: number | null;
  expectedEndDate: string | null;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

const BASE_COLUMNS =
  "id, membership_id, requested_amount, monthly_repayment, tenure_months, status, reserved_at, reservation_expires_at, approved_at, rejected_at, completed_at, created_at";

/** Added by migration 20261123090000_existing_loans.sql (BUILD-PLAN 0.3). */
const EXISTING_LOAN_COLUMNS = "origin, outstanding_balance_at_entry, expected_end_date";

/** Postgres "undefined_column": the database predates a migration this code already knows about. */
const UNDEFINED_COLUMN = "42703";

type RawRow = {
  id: string;
  membership_id: string;
  requested_amount: number | string;
  monthly_repayment: number | string;
  tenure_months: number;
  status: string;
  reserved_at: string | null;
  reservation_expires_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  created_at: string;
  origin?: string | null;
  outstanding_balance_at_entry?: number | string | null;
  expected_end_date?: string | null;
};

export function toLoanRow(row: RawRow): LoanRow {
  return {
    id: row.id,
    membershipId: row.membership_id,
    requestedAmount: Number(row.requested_amount),
    monthlyRepayment: Number(row.monthly_repayment),
    tenureMonths: row.tenure_months,
    status: row.status,
    reservedAt: row.reserved_at,
    reservationExpiresAt: row.reservation_expires_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    origin: row.origin ?? "application",
    outstandingAtEntry:
      row.outstanding_balance_at_entry === null || row.outstanding_balance_at_entry === undefined
        ? null
        : Number(row.outstanding_balance_at_entry),
    expectedEndDate: row.expected_end_date ?? null,
  };
}

/**
 * Every loan on the given memberships, newest first. What a caller sees is still decided by RLS:
 * a member reaches their own memberships' loans, staff their cooperative's.
 */
export async function loadLoanRows(supabase: Supabase, membershipIds: string[]): Promise<LoanRow[]> {
  if (membershipIds.length === 0) return [];

  const query = (columns: string) =>
    supabase
      .from("loans")
      .select(columns)
      .in("membership_id", membershipIds)
      .order("created_at", { ascending: false });

  let result = await query(`${BASE_COLUMNS}, ${EXISTING_LOAN_COLUMNS}`);

  // Before the existing-loans migration reaches this database (Previews share it, D043), read the
  // columns every loan has. Those loans are all applications, which is what the defaults say.
  if (result.error?.code === UNDEFINED_COLUMN) result = await query(BASE_COLUMNS);

  if (result.error) throw new Error(`Could not load loans: ${result.error.message}`);

  return ((result.data ?? []) as unknown as RawRow[]).map(toLoanRow);
}
