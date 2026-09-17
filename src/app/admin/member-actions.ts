"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { matchesEmployeeIdPattern } from "@/lib/onboarding";

/**
 * Member management writes (admin blueprint 5.3 and 5.4).
 *
 * Both go through the ordinary authenticated client, and both were checked against the policies
 * that already existed before anything new was written:
 *
 *   - `savings_transactions_insert_staff` (migration 006) already permits a cooperative's active
 *     staff to write a ledger row against any membership at that cooperative. No new policy was
 *     needed for 5.4, and none was added.
 *   - `member_roster_entries_insert_staff` (migration 010) already covers adding a single member
 *     by hand, which is the same act as importing one: 5.3 is a one-row import, so it writes the
 *     same row the wizard does and the same trigger links it later.
 *
 * An officer may do both. These are the day-to-day recording tasks the officer role exists for,
 * and the permission preset that distinguishes an officer who can approve loans has nothing to
 * say about recording what payroll already delivered.
 */

export type MemberActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: string;
};

async function callerCooperative(): Promise<{ id: string; name: string } | null> {
  const staff = await loadStaffContext();
  if (!staff) return null;

  const role = preferredRole(staff.roles);
  if (!role) return null;

  return { id: role.cooperativeId, name: role.cooperativeName };
}

/* ---------------------------------------------------------------------------
   5.3 Add Member
--------------------------------------------------------------------------- */

const addMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter the member's name.").max(120),
  employeeId: z.string().trim().min(1, "Enter their staff ID."),
  savingsBalance: z.string().trim(),
});

export async function addMemberAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  const parsed = addMemberSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    employeeId: String(formData.get("employeeId") ?? ""),
    savingsBalance: String(formData.get("savingsBalance") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key) fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: organization } = await supabase
    .from("organizations")
    .select("employee_id_pattern, employee_id_label")
    .limit(1)
    .maybeSingle();

  const pattern = organization?.employee_id_pattern ?? "^[0-9]{6}$";
  const label = organization?.employee_id_label ?? "staff ID";
  const employeeId = parsed.data.employeeId.replace(/\s+/g, "");

  if (!matchesEmployeeIdPattern(employeeId, pattern)) {
    return { fieldErrors: { employeeId: `That does not look like a valid ${label}.` } };
  }

  const raw = parsed.data.savingsBalance.replace(/[₦,\s]/g, "");
  const savings = raw === "" ? 0 : Number(raw);
  if (!Number.isFinite(savings) || savings < 0) {
    return { fieldErrors: { savingsBalance: "That opening balance is not a number." } };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A member added by hand is a one-row import: the same roster entry the wizard writes, so the
  // same trigger links it to a real membership when that person joins (DECISIONS.md D028).
  const { error } = await supabase.from("member_roster_entries").upsert(
    {
      cooperative_id: cooperative.id,
      employee_id: employeeId,
      name: parsed.data.name,
      savings_balance: savings,
      imported_by: user?.id ?? null,
    },
    { onConflict: "cooperative_id,employee_id" },
  );

  if (error) {
    return { error: "We could not add that member. Please try again." };
  }

  // If they already hold a Clarix account, they become a member immediately rather than waiting.
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existing) {
    const { data: already } = await supabase
      .from("cooperative_memberships")
      .select("id")
      .eq("cooperative_id", cooperative.id)
      .eq("user_id", existing.id)
      .maybeSingle();

    if (!already) {
      await supabase.from("cooperative_memberships").insert({
        cooperative_id: cooperative.id,
        user_id: existing.id,
        status: "active",
        joined_at: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/admin", "layout");

  return {
    saved: existing
      ? `${parsed.data.name} is a member from today.`
      : `${parsed.data.name} is on the roster. Their membership appears when they join Clarix.`,
  };
}

/* ---------------------------------------------------------------------------
   5.4 Record Savings Contribution / Repayment
--------------------------------------------------------------------------- */

const recordSchema = z.object({
  membershipId: z.string().uuid(),
  type: z.enum(["contribution", "withdrawal_record", "loan_repayment"]),
  amount: z.string().trim(),
  recordedAt: z.string().trim(),
  description: z.string().trim().max(160).optional(),
  loanId: z.string().trim().optional(),
});

/**
 * Records what payroll has already delivered. This is a ledger entry, never a transaction:
 * Clarix moves no money (DECISIONS.md D004), and the wording on the screen says so.
 *
 * The membership's savings balance is not written here. Migration 012 recomputes it from the
 * ledger whenever a row lands, so the figure on screen can never drift from the entries behind
 * it, which is the whole reason a member would trust it.
 */
export async function recordSavingsAction(
  _previous: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  const parsed = recordSchema.safeParse({
    membershipId: String(formData.get("membershipId") ?? ""),
    type: String(formData.get("type") ?? "contribution"),
    amount: String(formData.get("amount") ?? ""),
    recordedAt: String(formData.get("recordedAt") ?? ""),
    description: String(formData.get("description") ?? ""),
    loanId: String(formData.get("loanId") ?? ""),
  });

  if (!parsed.success) {
    return { error: "Something in that entry was not understood. Please check it and try again." };
  }

  const raw = parsed.data.amount.replace(/[₦,\s]/g, "");
  const amount = Number(raw);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { fieldErrors: { amount: "Enter an amount greater than zero." } };
  }

  const recordedAt = parsed.data.recordedAt ? new Date(parsed.data.recordedAt) : new Date();
  if (Number.isNaN(recordedAt.getTime())) {
    return { fieldErrors: { recordedAt: "That date was not understood." } };
  }
  if (recordedAt.getTime() > Date.now() + 86_400_000) {
    return { fieldErrors: { recordedAt: "That date is in the future." } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("savings_transactions").insert({
    membership_id: parsed.data.membershipId,
    type: parsed.data.type,
    amount,
    description: parsed.data.description || null,
    recorded_at: recordedAt.toISOString(),
    recorded_by: user?.id ?? null,
    // The database constrains this to repayments only, which is what keeps a repayment
    // attributable to the loan it pays down (DECISIONS.md D024).
    loan_id: parsed.data.type === "loan_repayment" ? parsed.data.loanId || null : null,
  });

  if (error) {
    return { error: "We could not record that entry. Please try again." };
  }

  revalidatePath("/admin", "layout");
  revalidatePath(`/admin/members/${parsed.data.membershipId}`);

  return { saved: "Recorded." };
}
