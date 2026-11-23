"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { landingPathFor } from "@/lib/staff";
import { demoCredentials, isDemoRole } from "@/lib/demo-sign-in";

/**
 * One tap on a "Sign in as" chip (D048). Reads that role's demo account from server-only
 * environment variables and signs in through the same Supabase call as the form, so the password
 * never travels to or from the browser. Nothing here logs the credentials or the error object.
 *
 * Refused unless `NEXT_PUBLIC_DEMO_MODE` is "true" and this is not Production, whatever the
 * browser sends: the chips being hidden is not the boundary, this check is.
 */
export async function demoSignInAction(role: string): Promise<{ error: string }> {
  if (!isDemoRole(role)) return { error: "That demo account isn't available here." };

  const credentials = demoCredentials(role);
  if (!credentials) return { error: "That demo account isn't available here." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) return { error: "That demo account could not sign in. Check its Preview settings." };

  // The same tail as the form's sign-in: claim any waiting invitation, then go to the role's home.
  await supabase.rpc("claim_staff_invitations");
  const staff = await loadStaffContext();
  redirect(staff ? landingPathFor(staff.roles, staff.isPlatformAdmin) : "/dashboard");
}
