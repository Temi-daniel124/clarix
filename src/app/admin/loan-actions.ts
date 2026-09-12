"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Deciding a loan application — admin blueprint 6.2.
 *
 * One call, because approving is four writes that must not come apart: the loan's status, the
 * audit entry, the notification to the member, and the reason where one was required. Two of
 * those tables have no insert policy at all by design, so `decide_loan_application` (migration
 * 014) is the only way any of it happens.
 *
 * Nothing is written until the admin's undo window has elapsed — the screen holds the decision
 * for a few seconds first (the Timed Undo pattern the blueprint asks for), which is why this
 * action is called late rather than optimistically.
 */

export type DecisionState = {
  error?: string;
  decided?: {
    status: string;
    overCap: boolean;
  };
};

export async function decideLoanAction(
  loanId: string,
  decision: "approve" | "reject",
  note: string,
): Promise<DecisionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("decide_loan_application", {
    target_loan_id: loanId,
    decision,
    note: note.trim() || undefined,
  });

  if (error) {
    // The database is what enforces the note on an over-cap approval, so its refusal is the one
    // worth repeating in the admin's own words rather than as a generic failure.
    if (error.message.includes("requires a reason")) {
      return {
        error: "Approving beyond this member's available capacity needs a short reason first.",
      };
    }
    if (error.message.includes("already been decided")) {
      return { error: "This application has already been decided." };
    }
    if (error.message.includes("may not decide") || error.message.includes("not decide loans")) {
      return { error: "Deciding loans is not switched on for your account." };
    }
    return { error: "We could not record that decision. Please try again." };
  }

  const result = Array.isArray(data) ? data[0] : data;

  revalidatePath("/admin", "layout");

  return {
    decided: {
      status: result?.status ?? (decision === "approve" ? "active" : "rejected"),
      overCap: Boolean(result?.was_over_cap),
    },
  };
}
