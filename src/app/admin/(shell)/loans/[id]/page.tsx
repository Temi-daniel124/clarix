import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadApplication } from "@/lib/supabase/admin-loans";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { LoanReview } from "@/components/admin/loan-review";
import {
  loadPayslipForReview,
  memberUserIdForMembership,
} from "@/lib/supabase/payslip-review";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loan application" };

/**
 * Loan Application Review (6.2) for a reservation still waiting, and Loan Detail (6.4) for one
 * already decided. One route, because it is one loan, and which half an admin needs depends
 * only on whether a decision has been made yet.
 */
export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [application, staff] = await Promise.all([loadApplication(id), loadStaffContext()]);
  if (!application) redirect("/admin/loans");

  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");
  if (!role.permissions.can_view_members) redirect("/admin");

  // The salary evidence, if this reviewer is currently entitled to it (D031). Everything about
  // whether they are is decided by `documents_select_loan_review`; asking is how we find out.
  const memberUserId = await memberUserIdForMembership(application.membershipId);
  const payslip = memberUserId ? await loadPayslipForReview(memberUserId) : null;

  let salaryGross: number | null = null;
  let salaryNet: number | null = null;
  let salaryConfirmedAt: string | null = null;

  if (payslip && memberUserId) {
    const supabase = await createClient();
    const { data: salary } = await supabase
      .from("users")
      .select("salary_gross, salary_net, salary_verified_at")
      .eq("id", memberUserId)
      .maybeSingle();

    salaryGross = salary?.salary_gross === null || salary?.salary_gross === undefined ? null : Number(salary.salary_gross);
    salaryNet = salary?.salary_net === null || salary?.salary_net === undefined ? null : Number(salary.salary_net);
    salaryConfirmedAt = salary?.salary_verified_at ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <LoanReview
        application={application}
        canDecide={role.canApproveLoans}
        payslip={payslip}
        salaryGross={salaryGross}
        salaryNet={salaryNet}
        salaryConfirmedAt={salaryConfirmedAt}
      />
    </div>
  );
}
