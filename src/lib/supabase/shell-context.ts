import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext, type StaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import type { ShellCooperative, ShellIdentity } from "@/components/shell/types";
import { firstNameOf, initialsOf } from "@/lib/names";

/**
 * What every app shell draws around a screen (BUILD-PLAN 1.4): who is signed in, whether they
 * have anything unread, which cooperatives they can switch between, and whether they have a
 * member side and a staff side to move between.
 *
 * Built on `loadStaffContext`, which every staff screen already calls in the same request, so the
 * only new reads are two head-only counts. Both are scoped by RLS and filtered to the caller's
 * own rows: a staff member can read their cooperative's memberships, and "am I a member" must
 * not count those.
 */
export const loadShellContext = cache(async function loadShellContext(): Promise<{
  staff: StaffContext;
  identity: ShellIdentity;
} | null> {
  const staff = await loadStaffContext();
  if (!staff) return null;

  const supabase = await createClient();
  const [unread, memberships] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", staff.userId)
      .is("read_at", null),
    supabase
      .from("cooperative_memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", staff.userId)
      .eq("status", "active"),
  ]);

  const current = preferredRole(staff.roles);
  const cooperatives: ShellCooperative[] = staff.roles
    .filter((role) => role.status === "active")
    .map((role) => ({
      id: role.cooperativeId,
      name: role.cooperativeName,
      roleLabel: role.title ?? (role.role === "admin" ? "Admin" : "Officer"),
      current: role.id === current?.id,
    }));

  return {
    staff,
    identity: {
      name: staff.name ?? staff.email ?? "You",
      firstName: firstNameOf(staff.name, staff.email),
      initials: initialsOf(staff.name, staff.email),
      hasUnread: (unread.count ?? 0) > 0,
      isMember: (memberships.count ?? 0) > 0,
      hasStaffRole: current !== null,
      isPlatformAdmin: staff.isPlatformAdmin,
      cooperatives,
    },
  };
});

export { otherViewFor } from "@/components/shell/other-view";
