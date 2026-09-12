"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendSupportMessage } from "@/lib/support";

export type ContactState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  sent?: boolean;
};

const messageSchema = z
  .string()
  .trim()
  .min(10, "A sentence or two, so support knows what to look at.")
  .max(2000, "That is longer than 2,000 characters — send the short version.");

/**
 * The Help contact form — blueprint 6.3.
 *
 * Asks for a message and nothing else. Who is writing is already known: the action reads the
 * name and email address off the signed-in account rather than making someone retype details
 * Clarix is holding. It stops there — the IPPIS number stays inside Clarix rather than travelling
 * to a third-party mail provider over a support question (SECURITY.md).
 *
 * If Resend has no key yet, this returns an honest failure rather than a confirmation for a
 * message that went nowhere. The screen shows the support address as a mailto link either way,
 * which is the path that works today.
 */
export async function sendSupportMessageAction(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = messageSchema.safeParse(String(formData.get("message") ?? ""));

  if (!parsed.success) {
    return { fieldErrors: { message: parsed.error.issues[0]?.message ?? "Write a message first." } };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();

  const result = await sendSupportMessage({
    fromName: profile?.name ?? null,
    fromEmail: profile?.email ?? user.email ?? null,
    message: parsed.data,
  });

  if (!result.ok) {
    return {
      error:
        result.reason === "not_configured"
          ? "Clarix cannot send mail yet, so this did not go through. Please email support directly using the address below — your message is still in the box, ready to copy."
          : "That did not send. Please try again, or email support directly using the address below.",
    };
  }

  return { sent: true };
}
