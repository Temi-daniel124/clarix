import type { Database } from "@/lib/supabase/database.types";
import { readPermissions, type PermissionKey } from "@/lib/permissions";

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
  /**
   * What this person may actually do here — default-deny, and enforced by the policies named in
   * `PERMISSIONS`, not by this object. An admin holds everything implicitly, so their row reads
   * as every flag granted rather than as the empty jsonb their record usually carries.
   */
  permissions: Record<PermissionKey, boolean>;
};

/** An admin passes every permission check in the database, so they read as granted everywhere. */
export function effectivePermissions(
  role: StaffRoleName,
  permissions: unknown,
): Record<PermissionKey, boolean> {
  if (role === "admin") {
    return {
      can_view_members: true,
      can_record_savings: true,
      can_approve_loans: true,
      can_import_members: true,
    };
  }

  return readPermissions(permissions);
}

/**
 * The two presets blueprint 2.5 asks for. Finer-grained toggles belong to Officer Management
 * (7.2); this is the starting point an admin picks while inviting somebody, and it is stored in
 * `cooperative_staff_roles.permissions` so a later screen can refine it rather than replace it.
 */
export const PERMISSION_PRESETS = {
  record_only: {
    label: "Can see members and record entries",
    description:
      "Open the member list, and record what payroll has delivered against a member. Cannot decide a loan.",
    permissions: {
      can_view_members: true,
      can_record_savings: true,
      can_approve_loans: false,
      can_import_members: false,
    },
  },
  can_approve: {
    label: "Can also approve loans",
    description:
      "Everything above, plus deciding loan applications — the cooperative's money, committed against a member's salary.",
    permissions: {
      can_view_members: true,
      can_record_savings: true,
      can_approve_loans: true,
      can_import_members: false,
    },
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
export function landingPathFor(roles: StaffRole[], isPlatformAdmin = false): string {
  // Operating the platform is this account's primary purpose, so it opens there "even if this
  // account also happens to hold an ordinary cooperative membership or staff role somewhere"
  // (super-admin blueprint 1.2).
  if (isPlatformAdmin) return "/platform";
  if (preferredRole(roles)) return "/admin";
  if (pendingInvites(roles).length > 0) return "/invite";
  return "/dashboard";
}
