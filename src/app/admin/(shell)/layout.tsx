import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { loadShellContext } from "@/lib/supabase/shell-context";
import { pendingInvites, preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";

/**
 * The cooperative staff shell, admin blueprint Part 3, officer blueprint Part 3.
 *
 * One shell, two navigations. An officer does the same day-to-day work an admin does and reaches
 * it through the same screens; what they do not get is the configuration layer, so the sidebar
 * they see has no "Manage cooperative" section at all and no audit log. That difference is
 * expressed here, in what the navigation offers, and again in each screen's own guard: a menu
 * that simply omits a destination is not a boundary on its own.
 *
 * Wraps every screen an admin or officer sees after signing in. The redirects here are for
 * people who have no business on these screens yet, not a security boundary: what a staff
 * account can actually read and write is decided by RLS, which is keyed on the same
 * `cooperative_staff_roles` row this checks (SECURITY.md).
 *
 * Somebody holding only an unaccepted invitation is sent to accept it, because every screen in
 * here would be empty for them until they do: the policies key on an *active* role.
 *
 * The setup sequence (blueprint 2.1-2.5) deliberately sits OUTSIDE this group, in its own quiet
 * single-column layout, for the same reason employee onboarding does: a wizard with a navigation
 * bar around it invites wandering off halfway through.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const shell = await loadShellContext();
  if (!shell) redirect("/login");
  const { staff, identity } = shell;

  const role = preferredRole(staff.roles);

  if (!role) {
    if (pendingInvites(staff.roles).length > 0) redirect("/invite");
    redirect("/dashboard");
  }

  return (
    <AppShell
      kind={role.role}
      identity={identity}
      permissions={{
        canImport: role.permissions.can_import_members,
        canViewMembers: role.permissions.can_view_members,
      }}
    >
      {children}
    </AppShell>
  );
}
