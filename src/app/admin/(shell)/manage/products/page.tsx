import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoanProductsManager } from "@/components/admin/loan-products-manager";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadLoanProducts, loadPeerRatioRange } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loan products" };

/** Loan Products & Policy Settings — admin blueprint 7.1, the same screen as setup step 2.3. */
export default async function ManageProductsPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const [products, peerRatioRange] = await Promise.all([
    loadLoanProducts(role.cooperativeId),
    loadPeerRatioRange(role.cooperativeId),
  ]);

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Loan products</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        The rules every eligibility check measures a loan against. Changing one applies to applications made from now on, not to loans already running.
      </p>

      <div className="mt-10">
        <LoanProductsManager products={products} peerRatioRange={peerRatioRange} />
      </div>
    </div>
  );
}
