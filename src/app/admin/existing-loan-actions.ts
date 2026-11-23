"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Add an existing loan (BUILD-PLAN 0.3, D036, documents blueprint §3).
 *
 * One RPC. `record_existing_loan` checks the caller's record permission at the member's
 * cooperative, inserts the loan as active and already running, and writes the audit entry, all in
 * one transaction under the member's advisory lock. Nothing here writes to `loans` directly.
 *
 * Called after the screen's Timed Undo has run out, the same way a loan decision is: until then
 * nothing has been written, and the screen says so.
 */

export type ExistingLoanInput = {
  membershipId: string;
  outstanding: string;
  monthly: string;
  /** "YYYY-MM" */
  startMonth: string;
  /** "YYYY-MM" */
  endMonth: string;
  original: string;
  loanProductId: string;
  note: string;
};

export type ExistingLoanState = {
  error?: string;
  fieldErrors?: Partial<Record<"outstanding" | "monthly" | "startMonth" | "endMonth" | "original", string>>;
  saved?: { availableBefore: number; availableAfter: number };
};

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const schema = z.object({
  membershipId: z.string().uuid(),
  outstanding: z.string(),
  monthly: z.string(),
  startMonth: z.string(),
  endMonth: z.string(),
  original: z.string(),
  loanProductId: z.string(),
  note: z.string().max(500),
});

function money(value: string): number | null {
  const cleaned = value.replace(/[₦,\s]/g, "");
  if (cleaned === "") return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

export async function recordExistingLoanAction(input: ExistingLoanInput): Promise<ExistingLoanState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: "Something in that loan was not understood. Please check it and try again." };
  }

  const data = parsed.data;
  const outstanding = money(data.outstanding);
  const monthly = money(data.monthly);
  const original = money(data.original);
  const fieldErrors: ExistingLoanState["fieldErrors"] = {};

  if (outstanding === null || !(outstanding > 0)) {
    fieldErrors.outstanding = "Enter what is still owed.";
  }
  if (monthly === null || !(monthly > 0)) {
    fieldErrors.monthly = "Enter the monthly repayment.";
  }
  if (original !== null && (!(original > 0) || (outstanding !== null && original < outstanding))) {
    fieldErrors.original = "The original amount cannot be less than what is still owed.";
  }
  if (!month.safeParse(data.startMonth).success) {
    fieldErrors.startMonth = "Choose the month it started.";
  }
  if (!month.safeParse(data.endMonth).success) {
    fieldErrors.endMonth = "Choose the month of the last repayment.";
  } else if (data.startMonth && data.endMonth < data.startMonth) {
    fieldErrors.endMonth = "The last repayment cannot be before the start month.";
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows, error } = await supabase.rpc("record_existing_loan", {
    target_membership_id: data.membershipId,
    outstanding_balance: outstanding as number,
    monthly_repayment: monthly as number,
    start_month: `${data.startMonth}-01`,
    expected_end_month: `${data.endMonth}-01`,
    loan_product_id: data.loanProductId || undefined,
    original_amount: original ?? undefined,
    note: data.note.trim() || undefined,
  });

  if (error) {
    // The database's own refusals are written for people; repeat the ones a person can act on.
    const message = error.message;
    if (message.includes("permission")) {
      return { error: "Recording loans is not switched on for your account." };
    }
    if (message.includes("future month")) {
      return { fieldErrors: { startMonth: "A loan already owed cannot start in a future month." } };
    }
    if (message.includes("120 months")) {
      return { fieldErrors: { endMonth: "A loan can run for at most 120 months." } };
    }
    if (message.includes("active member")) {
      return { error: "This member's membership is not active, so a loan cannot be recorded." };
    }
    return { error: "We could not add that loan. Please try again." };
  }

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row?.loan_id) {
    return { error: "We could not add that loan. Please try again." };
  }

  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/members/${data.membershipId}`);

  return {
    saved: {
      availableBefore: Number(row.available_before),
      availableAfter: Number(row.available_after),
    },
  };
}
