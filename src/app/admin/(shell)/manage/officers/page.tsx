import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OfficerInvites } from "@/components/admin/officer-invites";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadOfficers, loadPendingInvitations } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Officers" };

/** Officer Management — admin blueprint 7.2, the same screen as setup step 2.5. */
export default async function ManageOfficersPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const [officers, invitations] = await Promise.all([
    loadOfficers(role.cooperativeId),
    loadPendingInvitations(role.cooperativeId),
  ]);

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Officers</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Who else can act on this cooperative, and what each of them is allowed to do.
      </p>

      <div className="mt-10">
        <OfficerInvites officers={officers} invitations={invitations} />
      </div>
    </div>
  );
}
