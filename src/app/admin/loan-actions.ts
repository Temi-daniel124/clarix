"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Deciding a loan application (admin blueprint 6.2).
 *
 * One call, because approving is four writes that must not come apart: the loan's status, the
 * audit entry, the notification to the member, and the reason where one was required. Two of
 * those tables have no insert policy at all by design, so `decide_loan_application` (migration
 * 014) is the only way any of it happens.
 *
 * Nothing is written until the admin's undo window has elapsed: the screen holds the decision
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

/**
 * Marking an active loan repaid in full (admin blueprint 6.4).
 *
 * This one matters to more than this cooperative's own records. An active loan counts against the
 * member's deduction cap at every cooperative they belong to, so a loan left open after its last
 * repayment quietly holds capacity the member should have back. `complete_loan` (migration 029)
 * releases it and logs what was actually recorded against the loan, which may be less than it was
 * for if some of it was settled outside Clarix.
 */
export async function completeLoanAction(
  loanId: string,
  note: string,
): Promise<{ error?: string; completed?: { releasedMonthly: number; repaidTotal: number } }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("complete_loan", {
    target_loan_id: loanId,
    note: note.trim() || undefined,
  });

  if (error) {
    if (error.message.includes("permission")) {
      return { error: "Closing a loan is not switched on for your account." };
    }
    if (error.message.includes("Only an active loan")) {
      return { error: "This loan is not active, so there is nothing to close." };
    }
    return { error: "We could not close that loan. Please try again." };
  }

  const result = Array.isArray(data) ? data[0] : data;

  revalidatePath("/admin", "layout");

  return {
    completed: {
      releasedMonthly: Number(result?.released_monthly ?? 0),
      repaidTotal: Number(result?.repaid_total ?? 0),
    },
  };
}

/**
 * Tidying reservations whose hold has lapsed (admin blueprint 6.1).
 *
 * Nothing about capacity changes here, and that is worth knowing before using it: a lapsed
 * reservation stopped counting the moment it lapsed, because expiry is evaluated at read time
 * (D024). What this fixes is the queue, which otherwise shows requests as waiting on a decision
 * that can no longer be made.
 */
export async function expireLapsedReservationsAction(
  cooperativeId: string,
): Promise<{ error?: string; expired?: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("expire_lapsed_reservations", {
    target_cooperative_id: cooperativeId,
  });

  if (error) {
    if (error.message.includes("permission")) {
      return { error: "Acting on applications is not switched on for your account." };
    }
    return { error: "We could not tidy those applications. Please try again." };
  }

  revalidatePath("/admin", "layout");

  return { expired: Number(data ?? 0) };
}
