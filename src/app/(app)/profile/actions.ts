"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isNotificationCategory } from "@/lib/notifications";

/**
 * Profile / Settings (blueprint 6.2).
 *
 * Each section saves on its own. The blueprint is explicit about this: "smaller, immediate
 * confirmations rather than a single high-stakes submit", so there is one action per section
 * and no action that writes more than the section the employee was actually editing.
 *
 * Every write here goes through the ordinary authenticated client, so `users_update_own` decides
 * what lands: no service-role key, no elevated function. A section that could not be expressed
 * inside that policy would be a section that does not belong on this screen.
 */

export type SectionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** The small confirmation shown beside the section's save button. */
  saved?: string;
};

const personalSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(120),
    email: z.union([z.string().trim().email("That does not look like an email address."), z.literal("")]),
    phone: z.union([
      z
        .string()
        .trim()
        .regex(/^[0-9+\-\s()]{7,20}$/, "That does not look like a phone number."),
      z.literal(""),
    ]),
  })
  .refine((value) => value.email !== "" || value.phone !== "", {
    // The database says the same thing in users_contact_present. Catching it here means the
    // employee gets a sentence rather than a constraint violation.
    path: ["email"],
    message: "Keep at least one way to reach you: an email address or a phone number.",
  });

export async function updatePersonalInfoAction(
  _previous: SectionState,
  formData: FormData,
): Promise<SectionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = personalSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key) fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, phone } = parsed.data;

  const { error } = await supabase
    .from("users")
    .update({ name, email: email || null, phone: phone || null })
    .eq("id", user.id);

  if (error) {
    return { error: "We could not save those details just now. Please try again." };
  }

  // The greeting and the identity mark both read from this row.
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { saved: "Personal information updated." };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "That is longer than 72 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Those two do not match.",
  });

/**
 * Change password, Supabase Auth's own `updateUser`, never a password column of our own
 * (DECISIONS.md D021: credentials live in Auth and nowhere else).
 *
 * The current password is checked first by signing in with it. Supabase does not require that
 * by default: an open session is enough to set a new password, but an unattended unlocked
 * phone is exactly the case where that default is too generous for a product holding salary
 * data, and proving knowledge of the old password costs the real owner one field.
 */
export async function changePasswordAction(
  _previous: SectionState,
  formData: FormData,
): Promise<SectionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key) fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { currentPassword, newPassword } = parsed.data;

  if (!user.email) {
    return { error: "This account has no email address on it, so the password cannot be changed here." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reauthError) {
    return { fieldErrors: { currentPassword: "That is not your current password." } };
  }

  if (currentPassword === newPassword) {
    return { fieldErrors: { newPassword: "Choose a password you have not used here before." } };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: "We could not change your password just now. Please try again." };
  }

  return { saved: "Password changed." };
}

/**
 * One notification toggle. Deliberately one category per call rather than the whole set: a
 * toggle confirms itself the moment it is flipped, and sending the others back with it would
 * overwrite a change made on another device in the meantime.
 *
 * The merge is read-then-write rather than a jsonb operator, because PostgREST cannot express
 * `||` in an update. The window between the two is the length of one request against one row
 * only this person can write, and the cost of losing it is one toggle, so the simpler shape
 * wins here.
 */
export async function setNotificationPreferenceAction(
  _previous: SectionState,
  formData: FormData,
): Promise<SectionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const category = String(formData.get("category") ?? "");
  const enabled = String(formData.get("enabled") ?? "") === "true";

  if (!isNotificationCategory(category)) {
    return { error: "That notification type is not one we recognise." };
  }

  const { data: current } = await supabase
    .from("users")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  const existing =
    current?.notification_preferences && typeof current.notification_preferences === "object"
      ? (current.notification_preferences as Record<string, boolean>)
      : {};

  const { error } = await supabase
    .from("users")
    .update({ notification_preferences: { ...existing, [category]: enabled } })
    .eq("id", user.id);

  if (error) {
    return { error: "We could not save that preference. Please try again." };
  }

  revalidatePath("/profile");

  return { saved: enabled ? "Turned on." : "Turned off." };
}

export async function logOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
