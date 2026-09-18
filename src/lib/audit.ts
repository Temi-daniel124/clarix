/**
 * Shared vocabulary for the audit log (admin blueprint 8.3).
 *
 * Kept apart from the query module because the table that renders it is a client component: a
 * single import of the server Supabase client from there would pull server-only code into the
 * browser bundle, which is exactly what the build refused.
 */

export type AuditEntry = {
  id: string;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetTable: string;
  targetId: string | null;
  /** The member the entry is about, where the target resolves to one. */
  subjectName: string | null;
  subjectMembershipId: string | null;
  /** Fields that existed before and after, and differ: the old value beside the new. */
  changes: { field: string; from: string; to: string }[];
  /** Figures the action recorded about itself, which were never a "before" of anything. */
  context: { field: string; value: string }[];
  note: string | null;
};

export type AuditFilters = {
  action?: string;
  from?: string;
  to?: string;
  query?: string;
};

/** The verbs recorded so far, for the action filter. Grows as more screens record. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  approve_loan: "Loan approved",
  reject_loan: "Loan rejected",
  // Written by `log_elevated_view()` when Clarix support looks at this cooperative's records
  // under a time-boxed access grant (super-admin blueprint 7.3). It appears in THIS log, not the
  // platform's, because the cooperative whose data was read has the stronger claim to know.
  elevated_view: "Clarix support viewed a record",
  // Migration 029: closing a loan, and tidying a reservation whose hold ran out.
  complete_loan: "Loan marked repaid in full",
  expire_reservation: "Lapsed request moved out of the queue",
};

/**
 * How a recorded field reads to an admin, and which of them are money.
 *
 * The log stores machine field names and bare numbers, which is right for storage and wrong for a
 * person: "monthly repayment 18300" and "available before 115238.00" are both the raw row. Money
 * is shown in naira and a timestamp in Lagos time, so an entry reads the way every other figure in
 * the product does.
 */
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  status: "Status",
  monthly_repayment: "Monthly repayment",
  available_before: "Available before",
  over_cap: "Over the limit",
  repaid_recorded: "Repaid, as recorded",
  requested_amount: "Borrowed",
  shortfall_in_ledger: "Not recorded as repaid",
  expires_at: "Hold lapsed",
};

export const AUDIT_MONEY_FIELDS = new Set([
  "monthly_repayment",
  "available_before",
  "repaid_recorded",
  "requested_amount",
  "shortfall_in_ledger",
]);

export const AUDIT_DATE_FIELDS = new Set(["expires_at"]);

export function describeAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}
