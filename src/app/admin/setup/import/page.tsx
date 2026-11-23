import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RosterImport } from "@/components/admin/roster-import";
import { SetupStepIndicator } from "@/components/admin/setup-step-indicator";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadEmployeeIdPattern } from "@/lib/supabase/admin-data";
import { nextAdminStepHref } from "@/lib/admin-setup";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Import members" };

/** Member Roster Import (admin blueprint 2.4). */
export default async function SetupImportPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const employeeIdPattern = await loadEmployeeIdPattern();

  return (
    <div className="pt-2">
      <SetupStepIndicator current="import" />

      <h1 className="type-page-title mt-8 text-text">Bring your members across</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Upload the list you already keep. Clarix reads it on this device, shows you exactly what
        it found, and writes only the rows you confirm.
      </p>

      <div className="mt-10">
        <RosterImport
          employeeIdPattern={employeeIdPattern}
          cooperativeName={role.cooperativeName}
        />
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button render={<Link href={nextAdminStepHref("import")} />}>
          Continue to officers
          <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
        </Button>
        <Button variant="tertiary" render={<Link href="/admin" />}>
          Finish the rest later
        </Button>
      </div>
    </div>
  );
}
