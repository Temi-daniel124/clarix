import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { staffNav } from "@/components/admin-shell/destinations";
import { MoreScreen } from "@/components/shell/more-list";
import { loadShellContext, otherViewFor } from "@/lib/supabase/shell-context";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "More" };

/**
 * "More", admin blueprint Part 3, phone only. Holds exactly what the desktop sidebar and its
 * account menu show, in the same order, so the two densities never become two products.
 */
export default async function AdminMorePage() {
  const shell = await loadShellContext();
  const role = shell ? preferredRole(shell.staff.roles) : null;
  if (!shell || !role) redirect("/login");

  const nav = staffNav(role.role, role.permissions);

  return (
    <MoreScreen
      groups={[
        ...(nav.manage.length > 0 ? [{ label: "Manage cooperative", entries: nav.manage }] : []),
        { label: "Account", entries: nav.account },
      ]}
      otherView={otherViewFor("staff", shell.identity)}
    />
  );
}
