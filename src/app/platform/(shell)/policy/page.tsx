import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeductionPolicyForm } from "@/components/platform/deduction-policy-form";
import { loadDeductionPolicy } from "@/lib/supabase/platform-admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Policy" };

/**
 * Deduction Policy Settings (super-admin blueprint 6.1).
 *
 * A form over four columns that already exist and are already seeded, not new schema. What is new
 * is that anybody can change them: `organizations_update_platform_admin` has allowed it since
 * migration 001 and no screen had ever offered it.
 */
export default async function PolicyPage() {
  const policy = await loadDeductionPolicy();
  if (!policy) redirect("/platform");

  return (
    <div className="mx-auto w-full max-w-[680px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Deduction policy</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        The rule every cooperative at {policy.name} inherits. Two of these: the basis and the cap
, are what every eligibility figure in Clarix is worked out from, so changing either moves
        what every member is told they can borrow.
      </p>

      <div className="mt-10">
        <DeductionPolicyForm policy={policy} />
      </div>

      <p className="type-caption mt-10 max-w-[520px] text-text-muted">
        Every change here is recorded in the platform audit log, with the old value beside the new
        one.
      </p>
    </div>
  );
}
