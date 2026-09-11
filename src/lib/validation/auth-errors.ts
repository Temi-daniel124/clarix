/**
 * Plain-language wording for Supabase Auth failures.
 *
 * Supabase's own messages are written for developers reading a log, not for a nurse at Federal
 * Medical Centre trying to create an account: "email rate limit exceeded" tells an employee
 * nothing about what happened or what to do next. DESIGN_SYSTEM.md asks for copy that names the
 * actual mechanic and for states that explain the next step, so every message an employee can
 * reach is written here rather than passed through raw.
 *
 * Anything unrecognised falls back to a neutral sentence rather than leaking internal text.
 */

type AuthErrorLike = { message?: string; code?: string; status?: number };

export function describeAuthError(error: AuthErrorLike): string {
  const raw = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";

  if (code === "over_email_send_rate_limit" || raw.includes("rate limit")) {
    return (
      "We couldn't send your confirmation email just now — too many have gone out in the last " +
      "hour. Please wait a few minutes and try again."
    );
  }

  if (code === "user_already_exists" || raw.includes("already registered")) {
    return "That email address already has a Clarix account. Try signing in instead.";
  }

  if (code === "email_address_invalid" || raw.includes("is invalid")) {
    return "That email address wasn't accepted. Please check it and try again.";
  }

  if (code === "weak_password" || raw.includes("password should be")) {
    return "That password is too easy to guess. Use at least 8 characters, with a number.";
  }

  if (code === "email_not_confirmed" || raw.includes("not confirmed")) {
    return "Your email address hasn't been confirmed yet. Open the link we sent you first.";
  }

  if (code === "invalid_credentials" || raw.includes("invalid login credentials")) {
    return "That email address and password don't match an account.";
  }

  if (raw.includes("failed to fetch") || raw.includes("network")) {
    return "We couldn't reach Clarix. Check your connection and try again.";
  }

  return "Something went wrong creating your account. Please try again in a moment.";
}
