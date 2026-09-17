"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";

/**
 * The access-grant writes (super-admin blueprint 7.2).
 *
 * Both are thin. `request_access_grant()` and `revoke_access_grant()` do the real work, including
 * the checks, the cooperative admin's notification and the platform audit entry, because
 * `access_grants` has no write policy and those functions are the only way into it. What is here
 * is the shape of the form and the wording of a refusal.
 */

export type AccessState = {
  error?: string;
  fieldErrors?: Partial<Record<"cooperativeId" | "reason", string>>;
  saved?: string;
};

const requestSchema = z.object({
  cooperativeId: z.string().uuid("Choose a cooperative."),
  memberUserId: z.string().uuid().optional().or(z.literal("")),
  reason: z
    .string()
    .trim()
    // The same floor the CHECK constraint enforces. Stated here too so the refusal is a sentence
    // rather than a database error, and worded to say what a good reason looks like.
    .min(20, "Say what you are looking into and why. This is shown to the cooperative."),
});

export async function requestAccessAction(
  _previous: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const staff = await loadStaffContext();
  if (!staff?.isPlatformAdmin) return { error: "This account cannot request access." };

  const parsed = requestSchema.safeParse({
    cooperativeId: String(formData.get("cooperativeId") ?? ""),
    memberUserId: String(formData.get("memberUserId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: AccessState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "cooperativeId" || key === "reason") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("request_access_grant", {
    target_cooperative_id: parsed.data.cooperativeId,
    grant_reason: parsed.data.reason,
    target_member_user_id: parsed.data.memberUserId || undefined,
  });

  if (error) {
    return {
      error: error.message.includes("not a member")
        ? "That person is not a member of that cooperative."
        : "We could not submit that request.",
    };
  }

  revalidatePath("/platform", "layout");

  return {
    saved:
      "Submitted. The cooperative's admin has been told, and the access starts in an hour and lasts a day.",
  };
}

export async function revokeAccessAction(grantId: string): Promise<AccessState> {
  const staff = await loadStaffContext();
  if (!staff?.isPlatformAdmin) return { error: "This account cannot end an access grant." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_access_grant", { grant_id: grantId });

  if (error) return { error: "We could not end that access." };

  revalidatePath("/platform", "layout");
  return { saved: "Ended." };
}

/**
 * Records one record viewed under a live grant, the granular logging blueprint 7.3 asks for.
 *
 * Called from the Elevated Access View as it renders, not from a button, because what is being
 * recorded is that somebody looked. It writes into the audit log of the cooperative whose data it
 * was, where that cooperative's own admin reads it.
 */
export async function logElevatedViewAction(
  grantId: string,
  viewedTable: string,
  viewedId: string | null,
  detail: string,
): Promise<void> {
  const supabase = await createClient();

  // A failure here must not blank the screen, but it must not pass silently either: the function
  // refuses when the grant is not live, and that is the same moment the page stops rendering.
  const { error } = await supabase.rpc("log_elevated_view", {
    grant_id: grantId,
    viewed_table: viewedTable,
    viewed_id: viewedId ?? undefined,
    detail,
  });

  if (error) {
    console.error("[clarix] elevated view was not logged", error.message);
  }
}
