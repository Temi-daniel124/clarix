"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { landingPathFor } from "@/lib/staff";
import { RESET_TICKET_COOKIE } from "./ticket";

/**
 * Forgot password, and the screen the emailed link lands on.
 *
 * Clarix never holds a password of its own (DECISIONS.md D021): Supabase Auth owns the credential,
 * so both halves here are thin wrappers over `resetPasswordForEmail` and `updateUser`. What this
 * file adds is the two rules that are ours rather than the library's.
 */

export type ResetState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string>>;
  sent?: boolean;
};

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter the email address you sign in with."),
});

const chooseSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Those two passwords do not match.",
  });

/**
 * Ask for a reset link.
 *
 * **This always reports success.** Whether or not the address has an account, the screen says the
 * same thing, because a form that answers "no such account" is a form that tells anybody who asks
 * which of your staff use Clarix. The same reasoning already governs the sign-in screen, which
 * deliberately does not distinguish a wrong password from an unknown address.
 *
 * Worth being honest about the current state: delivery depends on a verified sending domain in
 * Resend, which is still outstanding, so today this reaches nobody but the Resend account owner.
 * The screen says so rather than implying an email is on its way.
 */
export async function requestResetAction(
  _previous: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = requestSchema.safeParse({ email: String(formData.get("email") ?? "") });

  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0]?.message ?? "Check that address." } };
  }

  const supabase = await createClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password/choose`,
  });

  return { sent: true };
}

/**
 * Choose the new password, on the session the emailed link established.
 *
 * There is deliberately no current-password field. Somebody arriving here has proved control of
 * the mailbox instead, which is the whole point of the flow, asking for a password they have by
 * definition forgotten would make the screen useless to the only people who need it.
 *
 * What replaces that check is the reset ticket: a short-lived, http-only cookie written only when
 * a reset link's token was actually exchanged. Without it this refuses, so a person who merely
 * holds a session cannot post to this action and skip the current-password check that Profile
 * makes. The ticket is cleared as soon as the password is set, so it is good for one use.
 */
export async function chooseNewPasswordAction(
  _previous: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const supabase = await createClient();
  const jar = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ticket = jar.get(RESET_TICKET_COOKIE)?.value;

  if (!user || !ticket || ticket !== user.id) {
    return {
      error:
        "This link has expired or was already used. Ask for a new one and open it on this device.",
    };
  }

  const parsed = chooseSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: ResetState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "password" || key === "confirmPassword") fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: "We could not set that password. Ask for a fresh link and try again." };
  }

  // One use only.
  jar.delete(RESET_TICKET_COOKIE);

  // The reset link already signed them in, so there is nowhere sensible to send them but in.
  const staff = await loadStaffContext();
  redirect(staff ? landingPathFor(staff.roles, staff.isPlatformAdmin) : "/dashboard");
}
