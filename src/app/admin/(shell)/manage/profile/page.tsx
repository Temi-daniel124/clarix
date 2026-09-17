import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CooperativeProfileForm } from "@/components/admin/cooperative-profile-form";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import {
  loadCooperativeProfile,
  loadLoanProducts,
  summariseProducts,
} from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Public profile" };

/** Public Profile Editor (admin blueprint 7.3), the same screen as setup step 2.2. */
export default async function ManageProfilePage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  // Officer blueprint Part 3: nothing under "Manage cooperative" is available to an officer
  // "regardless of how their individual permissions are configured". The sidebar omits it; this
  // is what makes the omission a boundary rather than a menu choice.
  if (role.role !== "admin") redirect("/admin");

  const [cooperative, products] = await Promise.all([
    loadCooperativeProfile(role.cooperativeId),
    loadLoanProducts(role.cooperativeId),
  ]);

  if (!cooperative) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Public profile</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        What an employee reads about this cooperative before applying to join.
      </p>

      <div className="mt-10">
        <CooperativeProfileForm
          cooperative={cooperative}
          productSummary={summariseProducts(products)}
        />
      </div>
    </div>
  );
}
