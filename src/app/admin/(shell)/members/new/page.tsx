import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddMemberForm } from "@/components/admin/add-member-form";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add a member" };

/** Add Member (admin blueprint 5.3). */
export default async function AddMemberPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  // Adding a member writes a roster entry, exactly as the import does, so it takes the same
  // granted permission (migration 017), and the database refuses it either way.
  if (!role.permissions.can_import_members) redirect("/admin/members");

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("employee_id_label, employee_id_pattern")
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-8 md:px-8 md:py-10">
      <AddMemberForm
        employeeIdLabel={organization?.employee_id_label ?? "Staff ID"}
        employeeIdPattern={organization?.employee_id_pattern ?? "^[0-9]{6}$"}
      />
    </div>
  );
}
