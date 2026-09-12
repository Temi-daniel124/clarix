import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfficerInvites } from "@/components/admin/officer-invites";
import { SetupStepIndicator } from "@/components/admin/setup-step-indicator";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadOfficers, loadPendingInvitations } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invite officers" };

/** Invite Officers — admin blueprint 2.5, the last step before the dashboard. */
export default async function SetupOfficersPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const [officers, invitations] = await Promise.all([
    loadOfficers(role.cooperativeId),
    loadPendingInvitations(role.cooperativeId),
  ]);

  return (
    <div className="pt-2">
      <SetupStepIndicator current="officers" />

      <h1 className="type-page-title mt-8 text-text">Who else works on this cooperative?</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Officers do the day-to-day: recording savings, submitting applications, and approving
        loans if you give them that. This step is optional, and it reopens whenever you need it.
      </p>

      <div className="mt-10">
        <OfficerInvites officers={officers} invitations={invitations} />
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button render={<Link href="/admin" />}>
          Go to my cooperative
          <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}
