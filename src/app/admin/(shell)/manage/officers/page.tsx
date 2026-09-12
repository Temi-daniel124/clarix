import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OfficerInvites } from "@/components/admin/officer-invites";
import { OfficerManagement } from "@/components/admin/officer-management";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadManagedOfficers, loadPendingInvitations } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Officers" };

/**
 * Officer Management — admin blueprint 7.2.
 *
 * Two things, in the order an admin needs them: the people who already act on this cooperative,
 * each opening into their own permission panel, and beneath that the invite form from setup 2.5.
 * Setup offers two presets because a first run should not be a permissions seminar; this screen
 * is where that starting point gets refined toggle by toggle.
 */
export default async function ManageOfficersPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const [officers, invitations] = await Promise.all([
    loadManagedOfficers(role.cooperativeId),
    loadPendingInvitations(role.cooperativeId),
  ]);

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Officers</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Who else can act on this cooperative, and exactly what each of them is allowed to do.
      </p>

      <div className="mt-8">
        <OfficerManagement officers={officers} />
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <OfficerInvites officers={[]} invitations={invitations} />
      </div>
    </div>
  );
}
