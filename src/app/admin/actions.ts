"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { PERMISSION_PRESETS, isPermissionPreset, preferredRole } from "@/lib/staff";

/**
 * Everything the cooperative-admin setup sequence writes — blueprint 2.2 to 2.5.
 *
 * Each action resolves the caller's own cooperative from their staff role rather than trusting a
 * cooperative id from the form. RLS would refuse a write to somebody else's cooperative anyway,
 * but there is no reason to send the attempt: the server already knows which cooperative this
 * person administers.
 */

export type AdminState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: string;
};

/** The caller's cooperative, or null when they are not an active admin of one. */
async function callerCooperative(): Promise<{ id: string; name: string } | null> {
  const staff = await loadStaffContext();
  if (!staff) return null;

  const role = preferredRole(staff.roles);
  if (!role || role.role !== "admin") return null;

  return { id: role.cooperativeId, name: role.cooperativeName };
}

/* ---------------------------------------------------------------------------
   2.2 Cooperative Profile Setup
--------------------------------------------------------------------------- */

const profileSchema = z.object({
  name: z.string().trim().min(3, "A cooperative needs a name members will recognise.").max(120),
  description: z
    .string()
    .trim()
    .max(600, "Keep this under 600 characters — it is a summary, not a constitution."),
  requirements: z.string().trim().max(600, "Keep this under 600 characters."),
});

export async function saveCooperativeProfileAction(
  _previous: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    requirements: String(formData.get("requirements") ?? ""),
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
  const { error } = await supabase
    .from("cooperatives")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      requirements: parsed.data.requirements || null,
    })
    .eq("id", cooperative.id);

  if (error) {
    return { error: "We could not save that just now. Please try again." };
  }

  revalidatePath("/admin", "layout");
  return { saved: "Profile updated. Employees browsing Discovery see this." };
}

/* ---------------------------------------------------------------------------
   2.3 Loan Product & Policy Configuration
--------------------------------------------------------------------------- */

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Give this product a name members will understand.").max(120),
  minSavingsPercentage: z.coerce
    .number({ message: "Enter the minimum savings percentage." })
    .gt(0, "A savings requirement has to be more than zero.")
    .max(100, "A member cannot be asked to have saved more than the whole amount."),
  maxTenureMonths: z.coerce
    .number({ message: "Enter the longest tenure allowed." })
    .int()
    .min(1, "At least one month.")
    .max(120, "Ten years is the longest Clarix models."),
  interestTerms: z.string().trim().max(400).optional(),
  isPublic: z.boolean(),
});

export async function saveLoanProductAction(
  _previous: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  const rawId = String(formData.get("id") ?? "");
  const parsed = productSchema.safeParse({
    id: rawId || undefined,
    name: String(formData.get("name") ?? ""),
    minSavingsPercentage: String(formData.get("minSavingsPercentage") ?? ""),
    maxTenureMonths: String(formData.get("maxTenureMonths") ?? ""),
    interestTerms: String(formData.get("interestTerms") ?? ""),
    isPublic: formData.get("isPublic") === "on" || formData.get("isPublic") === "true",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key) fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { id, name, minSavingsPercentage, maxTenureMonths, interestTerms, isPublic } = parsed.data;

  // Stored as a fraction, shown as a percentage: the database column is numeric(4,3) and every
  // eligibility calculation reads it as a ratio, so the conversion happens once, here.
  const row = {
    cooperative_id: cooperative.id,
    name,
    min_savings_ratio: Math.round((minSavingsPercentage / 100) * 1000) / 1000,
    max_tenure_months: maxTenureMonths,
    interest_terms: interestTerms || null,
    is_public: isPublic,
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("cooperative_loan_products").update(row).eq("id", id)
    : await supabase.from("cooperative_loan_products").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { name: "This cooperative already has a product with that name." } };
    }
    return { error: "We could not save that product. Please try again." };
  }

  revalidatePath("/admin", "layout");
  return { saved: id ? "Product updated." : "Product added." };
}

export async function deleteLoanProductAction(productId: string): Promise<AdminState> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("cooperative_loan_products")
    .delete()
    .eq("id", productId)
    .eq("cooperative_id", cooperative.id);

  if (error) {
    return { error: "We could not remove that product. Please try again." };
  }

  revalidatePath("/admin", "layout");
  return { saved: "Product removed." };
}

/* ---------------------------------------------------------------------------
   2.4 Member Roster Import
--------------------------------------------------------------------------- */

export type ImportRow = {
  employeeId: string;
  name: string | null;
  savingsBalance: number;
};

export type ImportResult = {
  error?: string;
  imported?: number;
  linked?: number;
  waiting?: number;
};

/**
 * Commits the rows an admin confirmed. Everything before this — reading the file, mapping the
 * columns, validating each row — happens in the browser, because none of it needs the database
 * and a 500-row spreadsheet has no business being uploaded three times while somebody fixes a
 * column mapping.
 *
 * A row whose IPPIS number already belongs to a Clarix account becomes a real membership
 * immediately. One that does not becomes a roster entry, and the trigger from migration 010
 * turns it into a membership the day that person joins (DECISIONS.md D028).
 */
export async function importRosterAction(rows: ImportRow[]): Promise<ImportResult> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  if (rows.length === 0) return { error: "There is nothing to import." };
  if (rows.length > 2000) {
    return { error: "That is more than 2,000 rows. Split the file and import it in parts." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: rosterError } = await supabase.from("member_roster_entries").upsert(
    rows.map((row) => ({
      cooperative_id: cooperative.id,
      employee_id: row.employeeId,
      name: row.name,
      savings_balance: row.savingsBalance,
      imported_by: user?.id ?? null,
    })),
    { onConflict: "cooperative_id,employee_id" },
  );

  if (rosterError) {
    return { error: "We could not save the roster. Nothing was imported." };
  }

  // Anyone in the import who already holds a Clarix account becomes a member now. The insert
  // carries no savings balance: the trigger reads it off the roster entry, so the two can never
  // disagree about what was imported.
  const { data: matched } = await supabase
    .from("users")
    .select("id, employee_id")
    .in(
      "employee_id",
      rows.map((row) => row.employeeId),
    );

  let linked = 0;

  if (matched && matched.length > 0) {
    const { data: existing } = await supabase
      .from("cooperative_memberships")
      .select("user_id")
      .eq("cooperative_id", cooperative.id)
      .in(
        "user_id",
        matched.map((row) => row.id),
      );

    const alreadyMembers = new Set((existing ?? []).map((row) => row.user_id));
    const toCreate = matched.filter((row) => !alreadyMembers.has(row.id));

    if (toCreate.length > 0) {
      const { error: membershipError } = await supabase.from("cooperative_memberships").insert(
        toCreate.map((row) => ({
          cooperative_id: cooperative.id,
          user_id: row.id,
          status: "active" as const,
          joined_at: new Date().toISOString(),
        })),
      );

      if (!membershipError) linked = toCreate.length;
    }
  }

  revalidatePath("/admin", "layout");

  return {
    imported: rows.length,
    linked,
    waiting: rows.length - linked,
  };
}

/* ---------------------------------------------------------------------------
   2.5 Invite Officers
--------------------------------------------------------------------------- */

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("That does not look like an email address."),
  title: z.string().trim().max(60).optional(),
  preset: z.string(),
});

export async function inviteOfficerAction(
  _previous: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    title: String(formData.get("title") ?? ""),
    preset: String(formData.get("preset") ?? "record_only"),
  });

  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0]?.message ?? "Check this address." } };
  }

  const preset = isPermissionPreset(parsed.data.preset) ? parsed.data.preset : "record_only";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_cooperative_staff", {
    target_cooperative_id: cooperative.id,
    invite_email: parsed.data.email,
    invite_role: "officer",
    invite_permissions: PERMISSION_PRESETS[preset].permissions,
    invite_title: parsed.data.title || undefined,
  });

  if (error) {
    return { error: "We could not create that invitation. Please try again." };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (result?.already_staff) {
    return { fieldErrors: { email: "That person is already an officer here." } };
  }

  revalidatePath("/admin", "layout");

  return {
    saved: result?.had_account
      ? "Invitation sent. It is waiting on their Clarix account."
      : "Invitation saved. It becomes a role the first time they sign in.",
  };
}

export async function cancelInvitationAction(invitationId: string): Promise<AdminState> {
  const cooperative = await callerCooperative();
  if (!cooperative) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("cooperative_id", cooperative.id);

  if (error) return { error: "We could not withdraw that invitation." };

  revalidatePath("/admin", "layout");
  return { saved: "Invitation withdrawn." };
}

/* ---------------------------------------------------------------------------
   1.1 Accept an invitation
--------------------------------------------------------------------------- */

/**
 * Moves the caller's own `invited` role to `active`.
 *
 * This is a plain update, not an elevated function, because migration 001 already wrote the
 * policy for exactly this: a person may move their own row from `invited` to `active` and make
 * no other change to it. The database is what enforces that, not this action.
 */
export async function acceptInvitationAction(roleId: string): Promise<AdminState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("cooperative_staff_roles")
    .update({ status: "active", accepted_at: new Date().toISOString() })
    .eq("id", roleId)
    .eq("user_id", user.id)
    .eq("status", "invited");

  if (error) {
    return { error: "We could not activate that role. Please try again." };
  }

  revalidatePath("/admin", "layout");
  return { saved: "Role activated." };
}
