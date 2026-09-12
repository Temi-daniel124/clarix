"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ApplyState = { error?: string; applied?: boolean };

/**
 * Apply to join a cooperative — the single apply path in the product (blueprint 4.4).
 *
 * The row lands as 'pending'. That is not a UI convention: the RLS policy on
 * cooperative_memberships only lets an employee insert their own row, and only in the pending
 * state, so the cooperative's own staff remain the ones who decide.
 */
export async function applyToCooperativeAction(
  _previous: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cooperativeId = String(formData.get("cooperativeId") ?? "");
  if (!z.string().uuid().safeParse(cooperativeId).success) {
    return { error: "That cooperative could not be found." };
  }

  const { error } = await supabase.from("cooperative_memberships").insert({
    user_id: user.id,
    cooperative_id: cooperativeId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { applied: true };
    return { error: "We could not send your application. Please try again." };
  }

  // The membership changes what My cooperatives, Discovery and the dashboard all show.
  revalidatePath("/cooperatives");
  revalidatePath("/cooperatives/discover");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding/cooperatives");

  return { applied: true };
}
