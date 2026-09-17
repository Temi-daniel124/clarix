"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";

/**
 * The Super Admin's writes (super-admin blueprint 5.2 and 5.3).
 *
 * Three actions, and between them they are the whole of what this role can change about a
 * cooperative: bring one into existence, name who runs it, and turn it off or back on. Nothing
 * here reaches a member, a loan or a balance, and there is deliberately no action that could.
 *
 * The `is_platform_admin()` check below is not the boundary. `cooperatives_insert_platform_admin`
 * and `cooperatives_update_own_admin` are, and they were written in migration 001. This check
 * exists so a signed-in employee who somehow posted this form gets a sentence rather than a
 * database error (SECURITY.md).
 */

export type PlatformState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "adminName" | "adminEmail", string>>;
  saved?: string;
};

const createSchema = z.object({
  name: z.string().trim().min(2, "Give the cooperative a name.").max(120),
  note: z.string().trim().max(400).optional(),
  adminName: z.string().trim().min(2, "Who will run it?").max(120),
  adminEmail: z.string().trim().toLowerCase().email("That does not look like an email address."),
});

async function requirePlatformAdmin() {
  const staff = await loadStaffContext();
  return staff?.isPlatformAdmin ? staff : null;
}

/**
 * Create Cooperative (blueprint 5.3).
 *
 * Two writes, in the order that keeps the record honest if the second fails: the cooperative
 * first, then its admin's invitation through `invite_cooperative_staff()`. That is the same
 * function a cooperative's own admin uses to invite an officer, widened in migration 019 to admit
 * a platform admin as a second legitimate caller, D027 settled that invitations are database
 * rows written by one narrow function, and a second function for the same act would be a second
 * place for the claim logic to drift.
 *
 * The cooperative is created `inactive`, which is what the blueprint means by "an
 * inactive-until-accepted state": it exists, it is listed, and it does not yet appear to members
 * browsing for a cooperative to join.
 */
export async function createCooperativeAction(
  _previous: PlatformState,
  formData: FormData,
): Promise<PlatformState> {
  const staff = await requirePlatformAdmin();
  if (!staff) return { error: "This account cannot create cooperatives." };

  const parsed = createSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    note: String(formData.get("note") ?? ""),
    adminName: String(formData.get("adminName") ?? ""),
    adminEmail: String(formData.get("adminEmail") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: PlatformState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "adminName" || key === "adminEmail") {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: organization } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
  if (!organization) return { error: "No organization is set up to create a cooperative under." };

  const { data: cooperative, error: createError } = await supabase
    .from("cooperatives")
    .insert({
      organization_id: organization.id,
      name: parsed.data.name,
      status: "inactive",
    })
    .select("id, name")
    .single();

  if (createError || !cooperative) {
    return { error: "We could not create that cooperative. Please try again." };
  }

  // The operator's own note, if they wrote one. Its own table rather than a column on
  // `cooperatives`, because that row is readable by every signed-in user (migration 021).
  if (parsed.data.note) {
    await supabase.from("cooperative_internal_notes").insert({
      cooperative_id: cooperative.id,
      note: parsed.data.note,
      updated_by: staff.userId,
    });
  }

  const { data: invite, error: inviteError } = await supabase.rpc("invite_cooperative_staff", {
    target_cooperative_id: cooperative.id,
    invite_email: parsed.data.adminEmail,
    invite_role: "admin",
    invite_permissions: {},
    invite_title: undefined,
    invite_name: parsed.data.adminName,
  });

  if (inviteError) {
    return {
      error:
        "The cooperative was created, but its admin invitation could not be issued. Open it from the directory and resend.",
    };
  }

  // Blueprint 7.1 lists cooperative creation as a platform event. Recorded here rather than by a
  // trigger, because what belongs in the log is the act and who performed it, not merely that a
  // row appeared.
  await supabase.rpc("record_platform_event", {
    event_action: "create_cooperative",
    event_target_table: "cooperatives",
    event_target_id: cooperative.id,
    event_new: { name: cooperative.name, admin_invited: parsed.data.adminEmail },
  });

  const result = Array.isArray(invite) ? invite[0] : invite;

  revalidatePath("/platform", "layout");

  return {
    saved: result?.had_account
      ? `${cooperative.name} is created. ${parsed.data.adminEmail} already has a Clarix account, so the role is waiting on their next sign-in.`
      : `${cooperative.name} is created and the invitation is recorded against ${parsed.data.adminEmail}.`,
  };
}

/**
 * Deactivate / reactivate (blueprint 5.2).
 *
 * The Timed Undo happens in the component before this is called, which is what makes the undo
 * real: nothing is written until the window closes.
 */
export async function setCooperativeStatusAction(
  cooperativeId: string,
  status: "active" | "inactive",
): Promise<PlatformState> {
  const staff = await requirePlatformAdmin();
  if (!staff) return { error: "This account cannot change a cooperative's status." };

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("cooperatives")
    .select("name, status")
    .eq("id", cooperativeId)
    .maybeSingle();

  const { error } = await supabase
    .from("cooperatives")
    .update({ status })
    .eq("id", cooperativeId);

  if (error) return { error: "We could not change that. Please try again." };

  await supabase.rpc("record_platform_event", {
    event_action: status === "active" ? "activate_cooperative" : "deactivate_cooperative",
    event_target_table: "cooperatives",
    event_target_id: cooperativeId,
    event_old: before ? { name: before.name, status: before.status } : null,
    event_new: { name: before?.name ?? null, status },
  });

  revalidatePath("/platform", "layout");
  return { saved: status === "active" ? "Reactivated." : "Deactivated." };
}

/**
 * Resend the admin invitation (blueprint 5.2), shown only while one is still unaccepted.
 *
 * "Resend" is honest about what it does: it rewrites the invitation row and its timestamp through
 * the same function that issued it. Clarix cannot put an email in front of anybody until a
 * sending domain is verified, and the screen says so rather than implying a message went out.
 */
export async function resendAdminInviteAction(
  cooperativeId: string,
  email: string,
): Promise<PlatformState> {
  const staff = await requirePlatformAdmin();
  if (!staff) return { error: "This account cannot issue invitations." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("invite_cooperative_staff", {
    target_cooperative_id: cooperativeId,
    invite_email: email,
    invite_role: "admin",
    invite_permissions: {},
    invite_title: undefined,
  });

  if (error) return { error: "We could not reissue that invitation." };

  await supabase.rpc("record_platform_event", {
    event_action: "reissue_admin_invite",
    event_target_table: "cooperatives",
    event_target_id: cooperativeId,
    event_new: { email },
  });

  revalidatePath("/platform", "layout");
  return { saved: "The invitation has been reissued and is waiting on their next sign-in." };
}
