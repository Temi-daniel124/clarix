import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReconciliationTable } from "@/components/admin/reconciliation-table";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadReconciliation, recentPeriods } from "@/lib/supabase/reconciliation-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reconciliation" };

/** Monthly Reconciliation Entry — admin blueprint 7.5. */
export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const [staff, query] = await Promise.all([loadStaffContext(), searchParams]);
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const periods = recentPeriods();
  const period =
    query.period && periods.some((entry) => entry.period === query.period)
      ? query.period
      : periods[0].period;

  const data = await loadReconciliation(role.cooperativeId, period);

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Reconciliation</h1>
      <p className="type-body mt-3 max-w-[600px] text-text-secondary">
        What Clarix expected payroll to deduct this month, against what actually reached the
        cooperative. A shortfall recorded here is a shortfall somebody can do something about.
      </p>

      <div className="mt-8">
        <ReconciliationTable cooperativePeriod={data} periods={periods} />
      </div>
    </div>
  );
}
