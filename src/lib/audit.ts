/**
 * Shared vocabulary for the audit log — admin blueprint 8.3.
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
  /** Fields that existed before and after, and differ — the old value beside the new. */
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
};

export function describeAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}
