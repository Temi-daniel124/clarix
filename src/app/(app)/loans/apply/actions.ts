"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SubmitState = {
  error?: string;
  submitted?: {
    loanId: string;
    eligible: boolean;
    monthlyRepayment: number;
    available: number;
    shortfall: number;
    reservationExpiresAt: string | null;
    // The cooperative's own rule, null when the application named no product.
    savingsRequired: number | null;
    savingsShortfall: number | null;
    meetsSavingsRatio: boolean | null;
  };
};

const schema = z.object({
  membershipId: z.string().uuid(),
  amount: z.coerce.number().positive().max(99_999_999),
  tenureMonths: z.coerce.number().int().min(1).max(120),
  loanProductId: z.string().uuid().nullable(),
});

/**
 * Submit a loan application (blueprint 5.5).
 *
 * One RPC, never a read-then-write from here. `submit_loan_application` takes an advisory lock
 * on the employee and recomputes their committed obligations inside it, which only works because
 * the whole thing is a single transaction (DECISIONS.md D008). Splitting it into a capacity check
 * followed by an insert would reopen exactly the race the product exists to close.
 *
 * A request that exceeds capacity is NOT rejected here. Clarix informs, it does not gatekeep
 * (PRODUCT.md principle 3): the function stores it as pending_review, holding nothing, and reports
 * the shortfall, and the cooperative decides (DECISIONS.md D040). The same is true of the product's savings ratio,
 * which the function now reports alongside the cap: a member short of it still reaches the
 * cooperative, carrying that fact with them.
 */
export async function submitLoanApplicationAction(
  _previous: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const parsed = schema.safeParse({
    membershipId: String(formData.get("membershipId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    tenureMonths: String(formData.get("tenureMonths") ?? ""),
    loanProductId: formData.get("loanProductId") ? String(formData.get("loanProductId")) : null,
  });

  if (!parsed.success) {
    return { error: "Check the amount and tenure, then try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("submit_loan_application", {
    target_membership_id: parsed.data.membershipId,
    requested_amount: parsed.data.amount,
    tenure_months: parsed.data.tenureMonths,
    loan_product_id: parsed.data.loanProductId ?? undefined,
  });

  if (error) {
    return { error: "We could not send your application. Please try again." };
  }

  const row = Array.isArray(data) ? data[0] : null;

  // Every outcome is now stored, within the limit or not (D040). A row with no loan id means the
  // database did not keep the application, and the member must never be told it was sent: that
  // was exactly the "Submit anyway" defect.
  if (!row || !row.loan_id) {
    return { error: "We could not send your application. Please try again." };
  }

  revalidatePath("/loans");
  revalidatePath("/dashboard");
  revalidatePath("/cooperatives");

  return {
    submitted: {
      loanId: row.loan_id,
      eligible: row.eligible,
      monthlyRepayment: Number(row.monthly_repayment),
      available: Number(row.available),
      shortfall: Number(row.shortfall),
      reservationExpiresAt: row.reservation_expires_at,
      // The generated types cannot express nullability for a set-returning function's columns,
      // and these three are genuinely null when the application named no product.
      savingsRequired: nullableNumber(row.savings_required),
      savingsShortfall: nullableNumber(row.savings_shortfall),
      meetsSavingsRatio: (row.meets_savings_ratio ?? null) as boolean | null,
    },
  };
}

function nullableNumber(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/** Step 2 preview: read-only, safe on every slider move, reserves nothing. */
export async function previewCapacityAction(proposedMonthlyRepayment: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("capacity_for_user", {
    proposed_monthly_repayment: proposedMonthlyRepayment,
  });

  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    cap: Number(row.cap),
    committed: Number(row.committed),
    available: Number(row.available),
    eligible: row.eligible,
    shortfall: Number(row.shortfall),
    headroom: Number(row.headroom),
  };
}
