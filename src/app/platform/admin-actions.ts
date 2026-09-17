"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { loadDeductionPolicy } from "@/lib/supabase/platform-admin-data";

/**
 * The Super Admin's two remaining writes (blueprint 6.1 and 8.1).
 *
 * Both record themselves in the platform audit log through `record_platform_event()`, which is
 * what 6.1 means by "every change here is recorded automatically in the Platform Audit Log". The
 * recording is not optional and not a separate user action: a policy change nobody can trace is
 * the failure this product exists to prevent, one level up.
 */

export type PolicyState = {
  error?: string;
  fieldErrors?: Partial<Record<"percentage" | "pattern" | "expiry", string>>;
  saved?: string;
};

const policySchema = z.object({
  basis: z.enum(["gross", "net"]),
  percentage: z.coerce
    .number()
    .min(1, "A cap below 1% would stop every loan on the platform.")
    .max(100, "A cap above 100% is not a cap."),
  label: z.string().trim().min(2).max(40),
  pattern: z.string().trim().min(2, "The format cannot be empty.").max(200),
  expiry: z.coerce
    .number()
    .int()
    .min(1, "A reservation has to last at least a day.")
    .max(90, "Ninety days is the longest a member's capacity should ever be held."),
});

async function requirePlatformAdmin() {
  const staff = await loadStaffContext();
  return staff?.isPlatformAdmin ? staff : null;
}

/**
 * Deduction Policy Settings (blueprint 6.1).
 *
 * "The single most consequential screen a Super Admin touches": the basis and the cap are the two
 * numbers every eligibility figure in Clarix is computed from, so a change here moves what every
 * member at every cooperative is told they can borrow, the moment it is saved.
 *
 * The confirmation the blueprint asks for is enforced here as well as shown on the screen. A
 * change to basis or percentage arrives with `confirmed` set only if the operator passed through
 * the confirmation step that names the old and new values; without it this refuses, so the step
 * cannot be skipped by posting the form directly.
 */
export async function saveDeductionPolicyAction(
  _previous: PolicyState,
  formData: FormData,
): Promise<PolicyState> {
  const staff = await requirePlatformAdmin();
  if (!staff) return { error: "This account cannot change the organization policy." };

  const parsed = policySchema.safeParse({
    basis: String(formData.get("basis") ?? "gross"),
    percentage: String(formData.get("percentage") ?? ""),
    label: String(formData.get("label") ?? ""),
    pattern: String(formData.get("pattern") ?? ""),
    expiry: String(formData.get("expiry") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: PolicyState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "percentage" || key === "pattern" || key === "expiry") {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const current = await loadDeductionPolicy();
  if (!current) return { error: "There is no organization to change." };

  const changesEligibility =
    parsed.data.basis !== current.deductionBasis ||
    parsed.data.percentage !== current.deductionMaxPercentage;

  if (changesEligibility && formData.get("confirmed") !== "yes") {
    return {
      error:
        "That change alters the eligibility calculation for every cooperative, so it needs confirming first.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("organizations")
    .update({
      deduction_basis: parsed.data.basis,
      deduction_max_percentage: parsed.data.percentage,
      employee_id_label: parsed.data.label,
      employee_id_pattern: parsed.data.pattern,
      reservation_expiry_days_default: parsed.data.expiry,
    })
    .eq("id", current.id);

  if (error) return { error: "We could not save that. Please try again." };

  // Old beside new, so the log can show what moved rather than merely that something did.
  await supabase.rpc("record_platform_event", {
    event_action: "update_deduction_policy",
    event_target_table: "organizations",
    event_target_id: current.id,
    event_old: {
      deduction_basis: current.deductionBasis,
      deduction_max_percentage: current.deductionMaxPercentage,
      employee_id_label: current.employeeIdLabel,
      employee_id_pattern: current.employeeIdPattern,
      reservation_expiry_days_default: current.reservationExpiryDaysDefault,
    },
    event_new: {
      deduction_basis: parsed.data.basis,
      deduction_max_percentage: parsed.data.percentage,
      employee_id_label: parsed.data.label,
      employee_id_pattern: parsed.data.pattern,
      reservation_expiry_days_default: parsed.data.expiry,
    },
  });

  revalidatePath("/platform", "layout");

  return {
    saved: changesEligibility
      ? "Saved. Every cooperative's eligibility figures now use the new rule."
      : "Saved.",
  };
}

export type AdminState = { error?: string; saved?: string };

/** Add a platform admin (blueprint 8.1). */
export async function grantPlatformAdminAction(email: string): Promise<AdminState> {
  const staff = await requirePlatformAdmin();
  if (!staff) return { error: "This account cannot add a platform admin." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grant_platform_admin", {
    admin_email: email.trim().toLowerCase(),
  });

  if (error) return { error: "We could not add that person." };

  const result = Array.isArray(data) ? data[0] : data;

  if (result?.granted) {
    revalidatePath("/platform", "layout");
    return { saved: `${email} can now operate the platform.` };
  }

  if (result?.reason === "already_admin") {
    return { error: "That person already operates the platform." };
  }

  // Honest rather than convenient: Clarix cannot create somebody's account for them (D021), and
  // this role has no signup door, so there is nothing to invite them into yet.
  return {
    error: `${email} has no Clarix account yet. They need one before they can be made a platform admin.`,
  };
}

/**
 * Remove a platform admin (blueprint 8.1).
 *
 * Self-removal is refused by `revoke_platform_admin()` itself, not here. The interface also hides
 * the control on your own row, but that is a courtesy; the function is the safeguard.
 */
export async function revokePlatformAdminAction(userId: string): Promise<AdminState> {
  const staff = await requirePlatformAdmin();
  if (!staff) return { error: "This account cannot remove a platform admin." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_platform_admin", { target_user_id: userId });

  if (error) {
    return {
      error: error.message.includes("own access")
        ? "You cannot remove your own access from this screen."
        : "We could not remove that person.",
    };
  }

  revalidatePath("/platform", "layout");
  return { saved: "Removed." };
}
