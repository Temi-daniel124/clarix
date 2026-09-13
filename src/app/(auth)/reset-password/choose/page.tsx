import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RESET_TICKET_COOKIE, RESET_TICKET_MAX_AGE } from "../ticket";
import { ChoosePasswordForm } from "./choose-password-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set a new password" };

/**
 * Forgot password, second half — where the emailed link lands.
 *
 * Supabase sends a one-time token on the link; exchanging it here is what turns the email into a
 * session, and is the same mechanic the staff invitation screen uses.
 *
 * **Why there is a ticket cookie.** Exchanging that token leaves an ordinary session behind, which
 * means that without something more, this screen would accept *any* signed-in person and let them
 * set a new password with no knowledge of the current one — quietly undoing the check the Profile
 * security section deliberately makes. That was the behaviour on the first build of this screen
 * and it was wrong. So the token exchange also writes a short-lived, http-only ticket, and the
 * server action refuses without it. Somebody who is merely signed in is sent to Profile instead,
 * where changing a password asks for the old one, as it should.
 */
export default async function ChoosePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; code?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const jar = await cookies();

  const arrivedWithToken = Boolean(params.token_hash || params.code);

  if (params.token_hash) {
    await supabase.auth.verifyOtp({ token_hash: params.token_hash, type: "recovery" });
  } else if (params.code) {
    // Newer Supabase links carry a PKCE code instead of a token hash.
    await supabase.auth.exchangeCodeForSession(params.code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (arrivedWithToken && user) {
    jar.set(RESET_TICKET_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/reset-password",
      maxAge: RESET_TICKET_MAX_AGE,
    });
  }

  const ticket = jar.get(RESET_TICKET_COOKIE)?.value;

  // Signed in, but not from a reset link: this is not the screen for them.
  if (user && !ticket) redirect("/profile");

  return <ChoosePasswordForm expired={!ticket} />;
}
