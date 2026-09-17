"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { isPermissionKey, readPermissions } from "@/lib/permissions";

/**
 * Officer Management writes (admin blueprint 7.2).
 *
 * No new policy was needed and none was added: `cooperative_staff_roles_update_admin` from
 * migration 001 already lets a cooperative's admin change rows at their own cooperative, which
 * is exactly what editing permissions, renaming a title and revoking access all are. Checked
 * before writing, the same way D027 checked the insert side.
 *
 * Every write here is scoped to the caller's own cooperative by resolving it from their role
 * rather than accepting an id from the form.
 */

export type OfficerActionState = {
  error?: string;
  saved?: string;
};

async function callerCooperative(): Promise<string | null> {
  const staff = await loadStaffContext();
  if (!staff) return null;

  const role = preferredRole(staff.roles);
  if (!role || role.role !== "admin") return null;

  return role.cooperativeId;
}

/**
 * One toggle at a time, merged into whatever is already stored.
 *
 * Sending the whole set back would overwrite a change another admin made in the meantime, and
 * this is a permissions table: the cost of a lost write here is somebody quietly keeping access
 * that was meant to be removed.
 */
export async function setOfficerPermissionAction(
  roleId: string,
  permissionKey: string,
  enabled: boolean,
): Promise<OfficerActionState> {
  const cooperativeId = await callerCooperative();
  if (!cooperativeId) redirect("/login");

  if (!isPermissionKey(permissionKey)) {
    return { error: "That is not a permission Clarix recognises." };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("cooperative_staff_roles")
    .select("permissions, role")
    .eq("id", roleId)
    .eq("cooperative_id", cooperativeId)
    .maybeSingle();

  if (!current) return { error: "We could not find that officer." };

  if (current.role === "admin") {
    return {
      error: "An admin holds every permission at their own cooperative; there is nothing to switch.",
    };
  }

  const existing = readPermissions(current.permissions);

  const { error } = await supabase
    .from("cooperative_staff_roles")
    .update({ permissions: { ...existing, [permissionKey]: enabled } })
    .eq("id", roleId)
    .eq("cooperative_id", cooperativeId);

  if (error) return { error: "We could not save that change. Please try again." };

  revalidatePath("/admin", "layout");
  return { saved: enabled ? "Turned on." : "Turned off." };
}

/** The cosmetic title: a display label, never a permission (docs/DATA-MODEL.md). */
export async function setOfficerTitleAction(
  roleId: string,
  title: string,
): Promise<OfficerActionState> {
  const cooperativeId = await callerCooperative();
  if (!cooperativeId) redirect("/login");

  const trimmed = title.trim().slice(0, 60);

  const supabase = await createClient();
  const { error } = await supabase
    .from("cooperative_staff_roles")
    .update({ title: trimmed || null })
    .eq("id", roleId)
    .eq("cooperative_id", cooperativeId);

  if (error) return { error: "We could not save that title." };

  revalidatePath("/admin", "layout");
  return { saved: "Title updated." };
}

/**
 * Removing access sets the role to `revoked` rather than deleting the row.
 *
 * A deleted row takes with it who granted it and when, which is exactly what somebody reviewing
 * a cooperative's history later would want. And revoking has no effect on any other relationship
 * that person holds: an officer role elsewhere, or their own membership at a third cooperative,
 * because every one of those is scoped independently to its own cooperative.
 */
export async function revokeOfficerAction(roleId: string): Promise<OfficerActionState> {
  const cooperativeId = await callerCooperative();
  if (!cooperativeId) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("cooperative_staff_roles")
    .update({ status: "revoked" })
    .eq("id", roleId)
    .eq("cooperative_id", cooperativeId)
    .neq("role", "admin");

  if (error) return { error: "We could not remove that officer's access." };

  revalidatePath("/admin", "layout");
  return { saved: "Access removed." };
}
