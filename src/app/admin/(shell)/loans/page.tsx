import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationQueue } from "@/components/admin/application-queue";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { loadApplications } from "@/lib/supabase/admin-loans";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loan applications" };

/** Loan Applications Queue — admin blueprint 6.1. */
export default async function LoansPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  // Every screen in the member and loan areas reads through `cooperative_memberships`, which
  // `can_view_members` governs (migration 016). Without it these screens would render an empty
  // shell rather than refuse, and an empty shell reads as a bug rather than as a boundary.
  if (!role.permissions.can_view_members) redirect("/admin");

  const { pending, decided } = await loadApplications(role.cooperativeId);

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="type-page-title text-text">Loan applications</h1>
          <p className="type-body mt-3 max-w-[560px] text-text-secondary">
            Every request waiting on a decision, oldest first, each with the eligibility answer
            already worked out.
          </p>
        </div>

        <Button variant="outline" size="sm" render={<Link href="/admin/loans/active" />}>
          Active loans
          <ArrowRight className="size-4" aria-hidden strokeWidth={2} />
        </Button>
      </div>

      <div className="mt-8">
        <ApplicationQueue pending={pending} decided={decided} />
      </div>
    </div>
  );
}
