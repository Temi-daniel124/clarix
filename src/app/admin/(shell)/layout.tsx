import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminBottomTabs, AdminSidebar, AdminTopBar } from "@/components/admin-shell/admin-nav";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { pendingInvites, preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";

/**
 * The cooperative admin shell — admin blueprint Part 3.
 *
 * Wraps every screen an admin or officer sees after signing in. The redirects here are for
 * people who have no business on these screens yet, not a security boundary: what a staff
 * account can actually read and write is decided by RLS, which is keyed on the same
 * `cooperative_staff_roles` row this checks (SECURITY.md).
 *
 * Somebody holding only an unaccepted invitation is sent to accept it, because every screen in
 * here would be empty for them until they do — the policies key on an *active* role.
 *
 * The setup sequence (blueprint 2.1-2.5) deliberately sits OUTSIDE this group, in its own quiet
 * single-column layout, for the same reason employee onboarding does: a wizard with a navigation
 * bar around it invites wandering off halfway through.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staff = await loadStaffContext();
  if (!staff) redirect("/login");

  const role = preferredRole(staff.roles);

  if (!role) {
    if (pendingInvites(staff.roles).length > 0) redirect("/invite");
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-1">
      <AdminSidebar cooperativeName={role.cooperativeName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar cooperativeName={role.cooperativeName} />
        <main className="flex-1 pb-32 md:pb-12">{children}</main>
      </div>

      <AdminBottomTabs />
    </div>
  );
}
