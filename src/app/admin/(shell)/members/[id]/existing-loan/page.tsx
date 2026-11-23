import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExistingLoanForm } from "@/components/admin/existing-loan-form";
import { loadMemberProfile } from "@/lib/supabase/admin-members";
import { loadLoanProducts } from "@/lib/supabase/admin-data";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add existing loan" };

/**
 * Add an existing loan (BUILD-PLAN 0.3, documents blueprint §3).
 *
 * A page for now, like Record an entry beside it. The blueprint puts this in a sheet; it moves
 * into the shared Sheet component when BUILD-PLAN 1.3 builds it, and the form is written to drop
 * straight in.
 */
export default async function ExistingLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [staff, profile] = await Promise.all([loadStaffContext(), loadMemberProfile(id)]);
  if (!profile) redirect("/admin/members");

  // The database refuses this without `can_record_savings` at the member's cooperative. Turning
  // back here means someone who typed the URL sees the member, not a form that would fail.
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role?.permissions.can_record_savings) redirect(`/admin/members/${id}`);
  if (profile.status !== "active") redirect(`/admin/members/${id}`);

  const products = await loadLoanProducts(profile.cooperativeId);

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 md:px-8 md:py-10">
      <ExistingLoanForm
        membershipId={profile.membershipId}
        memberName={profile.name ?? "This member"}
        capacity={profile.capacity && profile.salaryConfirmed ? profile.capacity : null}
        products={products.map((product) => ({ id: product.id, name: product.name }))}
      />
    </div>
  );
}
