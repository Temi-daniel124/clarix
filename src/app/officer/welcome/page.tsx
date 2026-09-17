import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { PERMISSIONS } from "@/lib/permissions";
import { OfficerWelcomeTour } from "./welcome-tour";

export const metadata: Metadata = { title: "Welcome to Clarix" };

/**
 * Welcome to Cooperative Officer (officer blueprint 2.1).
 *
 * Two slides rather than three, "since there's no setup wizard to prepare for here". The first
 * one is assembled on the server because the blueprint asks for it to be true of this person
 * rather than true of the role: "one sentence tailored to their own granted permissions rather
 * than a generic list". A tour that promised an officer they could approve loans when their admin
 * had not granted it would be the first thing Clarix told them, and it would be false.
 */
export default async function OfficerWelcomePage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const granted = PERMISSIONS.filter((permission) => role.permissions[permission.key]).map(
    (permission) => permission.phrase,
  );

  return (
    <OfficerWelcomeTour cooperativeName={role.cooperativeName} granted={granted} />
  );
}
