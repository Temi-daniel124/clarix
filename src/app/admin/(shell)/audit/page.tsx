import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { loadAuditLog } from "@/lib/supabase/audit-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log" };

/** Cooperative Audit Log — admin blueprint 8.3. */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string; query?: string }>;
}) {
  const [staff, filters] = await Promise.all([loadStaffContext(), searchParams]);
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  // Officer blueprint Part 3: nothing under "Manage cooperative" is available to an officer
  // "regardless of how their individual permissions are configured". The sidebar omits it; this
  // is what makes the omission a boundary rather than a menu choice.
  if (role.role !== "admin") redirect("/admin");

  const entries = await loadAuditLog(role.cooperativeId, filters);

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Audit log</h1>
      <p className="type-body mt-3 max-w-[600px] text-text-secondary">
        Who did what at {role.cooperativeName}, and when. This record covers this cooperative
        only, and nothing in it can be edited or removed — including by you.
      </p>

      <div className="mt-8">
        <AuditLogTable entries={entries} filters={filters} />
      </div>
    </div>
  );
}
