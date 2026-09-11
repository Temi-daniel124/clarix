"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { matchesEmployeeIdPattern } from "@/lib/onboarding";

export type StepState = { error?: string; fieldErrors?: Record<string, string> };

/**
 * Step 2.2 — record the employee's staff ID.
 *
 * Validated against `organizations.employee_id_pattern` rather than a hard-coded six digits, so
 * the rule lives with the organization that sets it. The uniqueness constraint is
 * UNIQUE(organization_id, employee_id) in the database, so a duplicate surfaces as a constraint
 * violation rather than a check-then-write race between two people registering the same ID.
 */
export async function saveEmployeeIdAction(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = String(formData.get("employeeId") ?? "").trim();

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, organizations(employee_id_label, employee_id_pattern)")
    .eq("id", user.id)
    .maybeSingle();

  const organization = Array.isArray(profile?.organizations)
    ? profile?.organizations[0]
    : profile?.organizations;

  if (!organization) {
    return { error: "We could not load your employer's settings. Please try again." };
  }

  if (!matchesEmployeeIdPattern(raw, organization.employee_id_pattern)) {
    return {
      fieldErrors: {
        employeeId: `That does not look like a valid ${organization.employee_id_label}.`,
      },
    };
  }

  const { error } = await supabase.from("users").update({ employee_id: raw }).eq("id", user.id);

  if (error) {
    // 23505 is unique_violation: the ID is already attached to another account in this
    // organization. Say so plainly, and point at the likely explanation.
    if (error.code === "23505") {
      return {
        fieldErrors: {
          employeeId:
            "This ID is already linked to an account — try signing in instead, or check the number on your payslip.",
        },
      };
    }
    return { error: "We could not save that just now. Please try again." };
  }

  redirect("/onboarding/payslip");
}

const salarySchema = z.object({
  grossSalary: z.coerce
    .number({ message: "Enter your gross salary." })
    .positive("Gross salary must be more than zero.")
    .max(99_999_999, "That figure looks too large — please check it."),
  netSalary: z.coerce
    .number({ message: "Enter your net salary." })
    .positive("Net salary must be more than zero.")
    .max(99_999_999, "That figure looks too large — please check it."),
  payPeriod: z.string().trim().max(64).optional(),
  documentId: z.string().uuid(),
});

/**
 * Step 2.4 — confirm or correct the salary figures, then save them against the account.
 *
 * This is the human checkpoint DECISIONS.md D006 requires: nothing reaches `users.salary_gross`
 * without someone reading it on screen first. `salary_source_doc_id` records which payslip the
 * figure came from, so "Extracted from your payslip" stays traceable afterwards.
 */
export async function confirmSalaryAction(
  _previous: StepState,
  formData: FormData,
): Promise<StepState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = salarySchema.safeParse({
    grossSalary: String(formData.get("grossSalary") ?? "").replace(/,/g, ""),
    netSalary: String(formData.get("netSalary") ?? "").replace(/,/g, ""),
    payPeriod: String(formData.get("payPeriod") ?? ""),
    documentId: String(formData.get("documentId") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key) fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { grossSalary, netSalary, payPeriod, documentId } = parsed.data;

  if (netSalary > grossSalary) {
    return {
      fieldErrors: { netSalary: "Net pay cannot be more than gross pay — please check both." },
    };
  }

  const { error: documentError } = await supabase
    .from("documents")
    .update({
      review_status: "confirmed",
      reviewed_at: new Date().toISOString(),
      pay_period: payPeriod || null,
    })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (documentError) {
    return { error: "We could not save your confirmation. Please try again." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      salary_gross: grossSalary,
      salary_net: netSalary,
      salary_verified_at: new Date().toISOString(),
      salary_source_doc_id: documentId,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "We could not save your salary figures. Please try again." };
  }

  redirect("/onboarding/cooperatives");
}
