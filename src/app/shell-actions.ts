"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { SELECTED_COOPERATIVE_COOKIE } from "@/lib/staff";

/**
 * The cooperative switcher (BUILD-PLAN 1.4). Remembers which of the caller's own cooperatives
 * the staff screens work in, then opens that cooperative's home.
 *
 * The cookie only ever chooses between roles RLS already returned for this account: an id that
 * is not one of them is refused here, and even a forged cookie selects nothing, because
 * `loadStaffContext` matches it against those same rows. What any screen can read is still
 * decided by the policies on `cooperative_staff_roles` (SECURITY.md).
 */
export async function switchCooperativeAction(cooperativeId: string): Promise<{ error: string } | void> {
  const staff = await loadStaffContext();
  if (!staff) redirect("/login");

  const role = staff.roles.find(
    (candidate) => candidate.cooperativeId === cooperativeId && candidate.status === "active",
  );
  if (!role) return { error: "You do not work at that cooperative." };

  (await cookies()).set(SELECTED_COOPERATIVE_COOKIE, cooperativeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/admin");
}

/** Sign out from any shell's account menu. */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
