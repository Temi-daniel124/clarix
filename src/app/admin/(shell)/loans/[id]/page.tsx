import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadApplication } from "@/lib/supabase/admin-loans";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { LoanReview } from "@/components/admin/loan-review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loan application" };

/**
 * Loan Application Review (6.2) for a reservation still waiting, and Loan Detail (6.4) for one
 * already decided — one route, because it is one loan, and which half an admin needs depends
 * only on whether a decision has been made yet.
 */
export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [application, staff] = await Promise.all([loadApplication(id), loadStaffContext()]);
  if (!application) redirect("/admin/loans");

  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");
  if (!role.permissions.can_view_members) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <LoanReview application={application} canDecide={role.canApproveLoans} />
    </div>
  );
}
