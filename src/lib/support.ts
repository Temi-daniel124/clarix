/**
 * Where a support message from Help (blueprint 6.3) goes, and how it gets there.
 *
 * DECISIONS.md D026 settles the address: a role mailbox rather than a person's, so the pilot can
 * hand support over without changing the product, and configurable so it can point at a real
 * inbox before the domain exists.
 *
 * Delivery is Resend's HTTP API rather than SMTP. Supabase's own custom-SMTP setting covers auth
 * mail only — confirmation and recovery — and nothing in the app can post a message through it,
 * so this is the first Clarix-owned email path. It sends from the same Resend account, which is
 * what "the existing integration" amounts to here.
 */

export const SUPPORT_EMAIL = process.env.CLARIX_SUPPORT_EMAIL?.trim() || "support@clarix.ng";

/** The verified sender. Resend refuses anything else, so this is not a cosmetic default. */
const SUPPORT_FROM = process.env.CLARIX_SUPPORT_FROM?.trim() || "onboarding@resend.dev";

export type SupportSendResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "rejected" };

export async function sendSupportMessage({
  fromName,
  fromEmail,
  message,
}: {
  fromName: string | null;
  fromEmail: string | null;
  message: string;
}): Promise<SupportSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  // No key provisioned yet. Say so honestly rather than showing a confirmation for a message
  // that went nowhere — the screen falls back to the mailto link, which always works.
  if (!apiKey) return { ok: false, reason: "not_configured" };

  // Name and email address only. The employee's IPPIS number identifies them in the hospital's
  // payroll and SECURITY.md treats it as sensitive personal data, so it does not leave Clarix for
  // a third-party mail provider over a support question — the account email is enough for support
  // to find the person inside Clarix.
  const lines = [
    `From: ${fromName ?? "Unnamed"}${fromEmail ? ` <${fromEmail}>` : ""}`,
    "",
    message,
  ];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SUPPORT_FROM,
        to: [SUPPORT_EMAIL],
        // So a reply goes to the employee rather than into the shared sender.
        reply_to: fromEmail ?? undefined,
        subject: `Clarix support — ${fromName ?? "an employee"}`,
        text: lines.join("\n"),
      }),
    });

    if (!response.ok) return { ok: false, reason: "rejected" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "rejected" };
  }
}
