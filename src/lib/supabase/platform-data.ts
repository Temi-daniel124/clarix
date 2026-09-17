import { createClient } from "@/lib/supabase/server";
import type { DirectoryEntry, PlatformOverview } from "@/lib/platform";

/**
 * The reads behind the Super Admin's screens (super-admin blueprint 4.1) and Part 5.
 *
 * Every one goes through a SECURITY DEFINER function rather than a table, and that is the whole
 * design rather than an optimisation. A Super Admin cannot read `cooperative_memberships`,
 * `cooperative_staff_roles`, `staff_invitations`, or anybody else's `users` row, and must not be
 * able to: ROLES-AND-PERMISSIONS.md calls the absence of standing access to member financial
 * detail "a hard requirement, not a convenience shortcut, even for debugging". The functions
 * return counts and a cooperative's own facts, so the question gets answered without the row ever
 * being exposed (migration 019, SECURITY.md).
 *
 * Both throw on a query error rather than returning an empty result. An elevated function that
 * refuses the caller and a platform with nothing on it produce the same empty array, and those
 * two must never look alike on screen.
 */

export async function loadPlatformOverview(): Promise<PlatformOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_overview");

  if (error) throw new Error(`Could not read the platform overview: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : data;

  return {
    totalCooperatives: row?.total_cooperatives ?? 0,
    activeCooperatives: row?.active_cooperatives ?? 0,
    employeeHeadcount: row?.employee_headcount ?? 0,
    pendingInvites: row?.pending_invites ?? 0,
  };
}

export async function loadCooperativeDirectory(): Promise<DirectoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_cooperative_directory");

  if (error) throw new Error(`Could not read the cooperative directory: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    memberCount: row.member_count ?? 0,
    officerCount: row.officer_count ?? 0,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
    adminStatus: row.admin_status,
    adminInvitedAt: row.admin_invited_at,
    adminAcceptedAt: row.admin_accepted_at,
    pendingInviteEmail: row.pending_invite_email,
    pendingInviteSentAt: row.pending_invite_sent_at,
    hasExpiryOverride: row.has_expiry_override ?? false,
    internalNote: row.internal_note,
  }));
}
