import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActiveLoansList } from "@/components/admin/active-loans-list";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { loadActiveLoans } from "@/lib/supabase/admin-loans";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Active loans" };

/** Active Loans — admin blueprint 6.3. */
export default async function ActiveLoansPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  // Every screen in the member and loan areas reads through `cooperative_memberships`, which
  // `can_view_members` governs (migration 016). Without it these screens would render an empty
  // shell rather than refuse, and an empty shell reads as a bug rather than as a boundary.
  if (!role.permissions.can_view_members) redirect("/admin");

  const loans = await loadActiveLoans(role.cooperativeId);

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Active loans</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        What is actually outstanding at {role.cooperativeName}, as opposed to what is waiting on a
        decision.
      </p>

      <div className="mt-8">
        <ActiveLoansList loans={loans} />
      </div>
    </div>
  );
}
