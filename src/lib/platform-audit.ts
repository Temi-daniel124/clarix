/**
 * The vocabulary of the platform audit log — super-admin blueprint 7.1.
 *
 * Separate from `src/lib/audit.ts` because the two logs are separate records, not two views of
 * one. A cooperative's log carries what its staff did to its members and is read by its own
 * admin; this one carries what the platform's operators did to the platform and is read by them.
 * Migration 023 keeps them apart in the database too — a platform admin can read only rows with
 * no cooperative, and a cooperative admin only rows with theirs.
 *
 * Kept apart from the query module for the same reason `audit.ts` is: the table that renders it
 * is a client component.
 */

export type PlatformEvent = {
  id: string;
  createdAt: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetTable: string;
  targetId: string | null;
  /** Values that existed before and after and differ — old beside new. */
  changes: { field: string; from: string; to: string }[];
  /** Facts the event recorded about itself, which were never a "before" of anything. */
  context: { field: string; value: string }[];
  note: string | null;
};

export type PlatformAuditFilters = {
  action?: string;
  from?: string;
  to?: string;
  query?: string;
};

/**
 * The verbs this log records. It is a closed list rather than a prettifier over whatever arrives,
 * because the filter above the table is built from it — an action nobody can name is an action
 * nobody can filter for.
 */
export const PLATFORM_ACTION_LABELS: Record<string, string> = {
  create_cooperative: "Cooperative created",
  activate_cooperative: "Cooperative activated",
  deactivate_cooperative: "Cooperative deactivated",
  reissue_admin_invite: "Admin invitation reissued",
  update_deduction_policy: "Deduction policy changed",
  grant_platform_admin: "Platform admin added",
  revoke_platform_admin: "Platform admin removed",
};

export function describePlatformAction(action: string): string {
  return PLATFORM_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

/** How a stored field name reads in a table cell. */
export function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    deduction_basis: "Deduction basis",
    deduction_max_percentage: "Maximum deduction",
    employee_id_pattern: "Staff ID format",
    employee_id_label: "Staff ID label",
    reservation_expiry_days_default: "Reservation expiry",
    name: "Name",
    status: "Status",
    email: "Email",
  };

  return labels[field] ?? field.replace(/_/g, " ");
}
