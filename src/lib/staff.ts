import type { Database } from "@/lib/supabase/database.types";

/**
 * Who a signed-in person is *to a cooperative* — the admin/officer side of the account model.
 *
 * One account can hold several of these at once, plus ordinary memberships elsewhere
 * (DECISIONS.md D010). Nothing here is a second identity: it is the same user row, wearing a
 * role that is always scoped to one cooperative.
 */

export type StaffRoleName = Database["public"]["Enums"]["staff_role"];
export type StaffRoleStatus = Database["public"]["Enums"]["staff_role_status"];

export type StaffRole = {
  id: string;
  cooperativeId: string;
  cooperativeName: string;
  role: StaffRoleName;
  status: StaffRoleStatus;
  /** The cosmetic name a cooperative uses instead of "Officer" — Treasurer, Secretary. */
  title: string | null;
  canApproveLoans: boolean;
};

/**
 * The two presets blueprint 2.5 asks for. Finer-grained toggles belong to Officer Management
 * (7.2); this is the starting point an admin picks while inviting somebody, and it is stored in
 * `cooperative_staff_roles.permissions` so a later screen can refine it rather than replace it.
 */
export const PERMISSION_PRESETS = {
  record_only: {
    label: "Can submit and record only",
    description:
      "Record savings, submit loan applications, and keep member records current. Cannot approve a loan.",
    permissions: { can_approve_loans: false },
  },
  can_approve: {
    label: "Can also approve loans",
    description:
      "Everything above, plus deciding loan applications — the cooperative's money, committed against a member's salary.",
    permissions: { can_approve_loans: true },
  },
} as const;

export type PermissionPreset = keyof typeof PERMISSION_PRESETS;

export function isPermissionPreset(value: string): value is PermissionPreset {
  return value in PERMISSION_PRESETS;
}

export function readsCanApproveLoans(permissions: unknown): boolean {
  if (!permissions || typeof permissions !== "object") return false;
  return (permissions as Record<string, unknown>).can_approve_loans === true;
}

/** An admin outranks an officer, and an active role outranks an unaccepted invitation. */
export function preferredRole(roles: StaffRole[]): StaffRole | null {
  const active = roles.filter((role) => role.status === "active");
  return (
    active.find((role) => role.role === "admin") ??
    active[0] ??
    null
  );
}

export function pendingInvites(roles: StaffRole[]): StaffRole[] {
  return roles.filter((role) => role.status === "invited");
}

/**
 * Where a person lands after signing in.
 *
 * Blueprint 1.2 is explicit that the same login screen serves everyone and that what differs is
 * where it leads: an admin goes to their cooperative, not to the employee dashboard, "since
 * managing a cooperative is the higher-stakes, more frequent task for someone in this role".
 * Somebody holding only an unaccepted invitation goes to the screen that accepts it, because
 * there is nothing else for them to do yet.
 */
export function landingPathFor(roles: StaffRole[]): string {
  if (preferredRole(roles)) return "/admin";
  if (pendingInvites(roles).length > 0) return "/invite";
  return "/dashboard";
}
