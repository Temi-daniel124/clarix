/**
 * What an officer may be allowed to do — admin blueprint 7.2.
 *
 * Default-deny: a flag that is not explicitly true is false, and the database agrees. Migration
 * 016 rewired the policies these govern so each toggle changes what Postgres permits, not just
 * what a jsonb column says. A switch that moved a stored value without moving a boundary would
 * read as a control and behave as a label, which is worse than not offering it.
 *
 * Admins are not listed here because they hold everything implicitly (`docs/DATA-MODEL.md`:
 * "admins implicitly have full cooperative permissions"), and an admin able to switch off their
 * own access to their own cooperative would be a worse failure than any of this prevents.
 */

export type PermissionKey =
  | "can_view_members"
  | "can_record_savings"
  | "can_approve_loans"
  | "can_import_members";

export type PermissionSpec = {
  key: PermissionKey;
  label: string;
  description: string;
  /** Where the boundary actually lives, so a reader can check the claim. */
  enforcedBy: string;
};

export const PERMISSIONS: PermissionSpec[] = [
  {
    key: "can_view_members",
    label: "See the member list",
    description:
      "Open the members area, search it, and read a member's savings, loans and capacity.",
    enforcedBy: "cooperative_memberships_select_staff",
  },
  {
    key: "can_record_savings",
    label: "Record contributions and repayments",
    description:
      "Enter what payroll has already delivered against a member, and fill in the monthly reconciliation.",
    enforcedBy: "savings_transactions_insert_staff",
  },
  {
    key: "can_approve_loans",
    label: "Approve or reject loan applications",
    description:
      "Decide applications — the cooperative's money, committed against a member's salary.",
    enforcedBy: "decide_loan_application",
  },
  {
    key: "can_import_members",
    label: "Add and import members",
    description:
      "Add one member by hand, or import a roster spreadsheet of staff IDs and opening balances.",
    enforcedBy: "member_roster_entries_insert_staff",
  },
];

/**
 * Blueprint 7.2 also lists "can submit loan applications". Submitting on a member's behalf is not
 * built: on the employee side a member submits their own, and the admin-side equivalent belongs
 * to a screen that does not exist yet. It is surfaced in the panel as unavailable rather than
 * quietly dropped, because an admin looking for it deserves to know it is coming rather than to
 * wonder whether they missed it.
 */
export const UNBUILT_PERMISSIONS = [
  {
    label: "Submit applications for a member",
    description:
      "Starting an application on somebody's behalf is not built yet — members apply for themselves.",
  },
];

export function readPermissions(value: unknown): Record<PermissionKey, boolean> {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    can_view_members: source.can_view_members === true,
    can_record_savings: source.can_record_savings === true,
    can_approve_loans: source.can_approve_loans === true,
    can_import_members: source.can_import_members === true,
  };
}

export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSIONS.some((permission) => permission.key === value);
}

/** What the two invite presets from blueprint 2.5 mean in full-permission terms. */
export const PRESET_PERMISSIONS: Record<string, Record<PermissionKey, boolean>> = {
  record_only: {
    can_view_members: true,
    can_record_savings: true,
    can_approve_loans: false,
    can_import_members: false,
  },
  can_approve: {
    can_view_members: true,
    can_record_savings: true,
    can_approve_loans: true,
    can_import_members: false,
  },
};
