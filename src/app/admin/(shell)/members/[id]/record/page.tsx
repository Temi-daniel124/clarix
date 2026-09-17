import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RecordEntryForm } from "@/components/admin/record-entry-form";
import { loadMemberProfile } from "@/lib/supabase/admin-members";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Record an entry" };

/** Record Savings Contribution / Repayment (admin blueprint 5.4). */
export default async function RecordEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [staff, profile] = await Promise.all([loadStaffContext(), loadMemberProfile(id)]);
  if (!profile) redirect("/admin/members");

  // The database refuses this write without `can_record_savings` (migration 016). Turning back
  // here means an officer who typed the URL sees the member rather than a form that would fail.
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role?.permissions.can_record_savings) redirect(`/admin/members/${id}`);

  const repayable = profile.loans
    .filter((loan) => loan.status === "active")
    .map((loan) => ({
      id: loan.id,
      label: `${formatNaira(loan.requestedAmount)} over ${loan.tenureMonths} months`,
    }));

  const defaultType =
    query.type === "loan_repayment"
      ? "loan_repayment"
      : query.type === "withdrawal_record"
        ? "withdrawal_record"
        : "contribution";

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 md:px-8 md:py-10">
      <RecordEntryForm
        membershipId={profile.membershipId}
        memberName={profile.name ?? "This member"}
        currentBalance={profile.savingsBalance}
        defaultType={defaultType}
        loans={repayable}
      />
    </div>
  );
}
