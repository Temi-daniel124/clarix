import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanProductsManager } from "@/components/admin/loan-products-manager";
import { SetupStepIndicator } from "@/components/admin/setup-step-indicator";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadLoanProducts, loadPeerRatioRange } from "@/lib/supabase/admin-data";
import { nextAdminStepHref } from "@/lib/admin-setup";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loan products" };

/** Loan Product & Policy Configuration (admin blueprint 2.3). */
export default async function SetupProductsPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const [products, peerRatioRange] = await Promise.all([
    loadLoanProducts(role.cooperativeId),
    loadPeerRatioRange(role.cooperativeId),
  ]);

  return (
    <div className="pt-2">
      <SetupStepIndicator current="products" />

      <h1 className="type-page-title mt-8 text-text">What this cooperative lends</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Every eligibility check Clarix runs measures a loan against these rules. A cooperative can
        have several products: an emergency loan and a development loan work differently, and
        both belong here.
      </p>

      <div className="mt-10">
        <LoanProductsManager products={products} peerRatioRange={peerRatioRange} />
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button render={<Link href={nextAdminStepHref("products")} />}>
          Continue to members
          <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
        </Button>
        <Button variant="tertiary" render={<Link href="/admin" />}>
          Finish the rest later
        </Button>
      </div>
    </div>
  );
}
