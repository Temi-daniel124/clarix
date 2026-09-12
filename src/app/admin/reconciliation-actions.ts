"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * One row of the monthly reconciliation — admin blueprint 7.5.
 *
 * Deliberately one row per call. The blueprint asks for rows that save independently as they are
 * filled in, and a cooperative with four hundred members will not enter a month in one sitting.
 *
 * No new policy was needed: `deduction_reconciliation`'s own policies from migration 016 scope
 * this to staff of the member's cooperative who hold the recording permission — the same
 * permission that governs entering a contribution, because it is the same kind of act.
 */

export type ReconciliationState = {
  error?: string;
};

export async function recordReconciliationAction(
  membershipId: string,
  period: string,
  expected: number,
  actual: number,
): Promise<ReconciliationState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return { error: "That month was not understood." };
  }

  if (!Number.isFinite(actual) || actual < 0) {
    return { error: "Enter an amount of zero or more." };
  }

  const { error } = await supabase.from("deduction_reconciliation").upsert(
    {
      membership_id: membershipId,
      period,
      // Stored rather than recomputed on read: what was expected AT THE TIME is the fact worth
      // keeping, and a loan completed since must not rewrite last month's history.
      expected_amount: expected,
      actual_amount_received: actual,
      entered_by: user.id,
      entered_at: new Date().toISOString(),
    },
    { onConflict: "membership_id,period" },
  );

  if (error) {
    return { error: "We could not save that figure. Please try again." };
  }

  revalidatePath("/admin/manage/reconciliation");
  return {};
}
