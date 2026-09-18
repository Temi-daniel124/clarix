import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, MailQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { pendingInvites, preferredRole } from "@/lib/staff";
import { AcceptInvite } from "./accept-invite";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Accept your invitation" };

/**
 * Accept Invite, cooperative admin blueprint 1.1.
 *
 * The blueprint describes two arrivals and this screen serves both, because they are the same
 * moment seen from either side of having an account already:
 *
 *   - **A brand-new account**, arriving from the link in the invitation email. Supabase's own
 *     invite/recovery link carries a token that establishes a session; this page then asks for a
 *     password and activates the role.
 *   - **An account that already exists**: the person is an employee-member somewhere, or an
 *     officer at another cooperative. The blueprint is explicit: "Welcome back. This invite has
 *     been added to your existing account", and no password step, because one email always
 *     resolves to one account however many roles it holds (DECISIONS.md D010).
 *
 * There is deliberately no self-registration anywhere on this screen. That door does not exist
 * for this role, and a "create an account instead" link would imply it did.
 */
export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // A link from an invitation email carries a one-time token. Exchanging it here is what turns
  // an email into a session; everything after that is the same for both arrivals.
  if (params.token_hash) {
    await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type === "recovery" ? "recovery" : "invite",
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-[520px] px-5 py-16 md:px-8">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
        >
          <MailQuestion className="size-5" strokeWidth={1.75} />
        </span>

        <h1 className="type-page-title mt-6 text-text">This invitation needs its own link</h1>
        <p className="type-body mt-3 text-text-secondary">
          Open the link from the email the cooperative sent you, on this device. If you already
          have a Clarix account, signing in is enough: the invitation is attached to your email
          address and will be waiting.
        </p>

        <Button className="mt-8" render={<Link href="/login" />}>
          Sign in
          <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
        </Button>
      </div>
    );
  }

  // An invitation issued before this person had an account lives against their email address
  // until something claims it. Signing in is one such moment; arriving here is another.
  await supabase.rpc("claim_staff_invitations");

  const staff = await loadStaffContext();
  const invites = staff ? pendingInvites(staff.roles) : [];

  if (invites.length === 0) {
    // Nothing to accept. Somebody who already has an active role belongs in the app, and an
    // employee with no staff role at all belongs on their own dashboard.
    redirect(staff && preferredRole(staff.roles) ? "/admin" : "/dashboard");
  }

  // Which half of the blueprint applies comes from how they arrived, not from inspecting the
  // account's internals. A token in the URL means this session was just minted from an
  // invitation link, so there is no password yet; anyone else reached this page already signed
  // in, which by definition means they have one. `last_sign_in_at` covers the case of an invited
  // account that opened the link, wandered off before setting a password, and came back.
  const needsPassword = Boolean(params.token_hash) || !user.last_sign_in_at;

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 py-16 md:px-8">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-card text-emerald"
        style={{ backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)" }}
      >
        <Building2 className="size-6" strokeWidth={1.75} />
      </span>

      <AcceptInvite
        invites={invites.map((invite) => ({
          id: invite.id,
          cooperativeName: invite.cooperativeName,
          role: invite.role,
          title: invite.title,
        }))}
        email={staff?.email ?? user.email ?? ""}
        needsPassword={needsPassword}
      />
    </div>
  );
}
