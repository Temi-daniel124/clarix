import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberList } from "@/components/admin/member-list";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { loadMembers } from "@/lib/supabase/admin-members";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Members" };

/** Member Search / List (admin blueprint 5.1). */
export default async function MembersPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  // Every screen in the member and loan areas reads through `cooperative_memberships`, which
  // `can_view_members` governs (migration 016). Without it these screens would render an empty
  // shell rather than refuse, and an empty shell reads as a bug rather than as a boundary.
  if (!role.permissions.can_view_members) redirect("/admin");

  const members = await loadMembers(role.cooperativeId);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Members</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Everyone {role.cooperativeName} counts as a member, including anyone imported who has not
        joined Clarix yet.
      </p>

      <div className="mt-8">
        <MemberList members={members} canAddMember={role.permissions.can_import_members} />
      </div>
    </div>
  );
}
