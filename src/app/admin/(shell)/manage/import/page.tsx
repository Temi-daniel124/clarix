import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RosterImport } from "@/components/admin/roster-import";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadEmployeeIdPattern } from "@/lib/supabase/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Import members" };

/** Member Roster Import (ongoing) — admin blueprint 7.4, the same screen as setup step 2.4. */
export default async function ManageImportPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const employeeIdPattern = await loadEmployeeIdPattern();

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Import members</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Bring in a new batch, or re-import a corrected sheet. A staff ID already on your roster is updated rather than duplicated.
      </p>

      <div className="mt-10">
        <RosterImport
          employeeIdPattern={employeeIdPattern}
          cooperativeName={role.cooperativeName}
        />
      </div>
    </div>
  );
}
