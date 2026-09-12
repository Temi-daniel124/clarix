import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CooperativeProfileForm } from "@/components/admin/cooperative-profile-form";
import { SetupStepIndicator } from "@/components/admin/setup-step-indicator";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import {
  loadCooperativeProfile,
  loadLoanProducts,
  summariseProducts,
} from "@/lib/supabase/admin-data";
import { nextAdminStepHref } from "@/lib/admin-setup";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cooperative profile" };

/** Cooperative Profile Setup — admin blueprint 2.2. */
export default async function SetupProfilePage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const [cooperative, products] = await Promise.all([
    loadCooperativeProfile(role.cooperativeId),
    loadLoanProducts(role.cooperativeId),
  ]);

  if (!cooperative) redirect("/admin");

  return (
    <div className="pt-2">
      <SetupStepIndicator current="profile" />

      <h1 className="type-page-title mt-8 text-text">The front door of your cooperative</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        This is what an employee reads when they find you on Discovery and decide whether to
        apply. Two short paragraphs do more work here than a page of policy.
      </p>

      <div className="mt-10">
        <CooperativeProfileForm
          cooperative={cooperative}
          productSummary={summariseProducts(products)}
        />
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button render={<Link href={nextAdminStepHref("profile")} />}>
          Continue to loan products
          <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
        </Button>
        <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
          Finish the rest later
        </Button>
      </div>
    </div>
  );
}
