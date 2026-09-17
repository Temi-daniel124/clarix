import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberProfileView } from "@/components/admin/member-profile";
import { loadMemberProfile } from "@/lib/supabase/admin-members";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Member" };

/** Member Profile, staff view (admin blueprint 5.2). */
export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [staff, profile] = await Promise.all([loadStaffContext(), loadMemberProfile(id)]);

  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");
  if (!role.permissions.can_view_members) redirect("/admin");

  // RLS returns nothing for a membership at another cooperative, so this covers both "no such
  // member" and "not yours" without the screen having to tell them apart.
  if (!profile) redirect("/admin/members");

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-10">
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/admin/members" />}>
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        Members
      </Button>

      <div className="mt-6">
        <MemberProfileView profile={profile} canRecord={role.permissions.can_record_savings} />
      </div>
    </div>
  );
}
