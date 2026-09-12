"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { acceptInvitationAction } from "@/app/admin/actions";

export type InviteSummary = {
  id: string;
  cooperativeName: string;
  role: "admin" | "officer";
  title: string | null;
};

/**
 * The two halves of blueprint 1.1, in one component because they differ by two fields and a
 * headline, not by shape.
 *
 * The password is set through Supabase Auth's own `updateUser`, on the session the invitation
 * link established — Clarix never holds a password of its own (DECISIONS.md D021). The email
 * address is shown and not editable: it is the identity the invitation was issued to, and
 * letting it be changed here would defeat the point of an invitation.
 */
export function AcceptInvite({
  invites,
  email,
  needsPassword,
}: {
  invites: InviteSummary[];
  email: string;
  needsPassword: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const first = invites[0];
  const roleLabel = first.role === "admin" ? "manage" : "help run";

  const submit = () => {
    setError(null);

    startTransition(async () => {
      if (needsPassword) {
        if (password.length < 8) {
          setError("Use at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Those two passwords do not match.");
          return;
        }

        const supabase = createClient();
        const { error: passwordError } = await supabase.auth.updateUser({ password });

        if (passwordError) {
          setError("We could not set that password. Please try the link again.");
          return;
        }
      }

      for (const invite of invites) {
        const result = await acceptInvitationAction(invite.id);
        if (result.error) {
          setError(result.error);
          return;
        }
      }

      // Where each role lands is written in its own blueprint: an admin into the setup sequence,
      // a brand-new officer into their two-slide orientation (officer blueprint 2.1), and an
      // existing account that just added a role "straight to the Officer Home screen (4.1)",
      // because somebody already using Clarix does not need to be introduced to it again.
      router.push(
        first.role === "admin"
          ? "/admin/setup/welcome"
          : needsPassword
            ? "/officer/welcome"
            : "/admin",
      );
    });
  };

  return (
    <div>
      <h1 className="type-page-title mt-6 text-text">
        {needsPassword
          ? `You have been invited to ${roleLabel} ${first.cooperativeName}`
          : "Welcome back — this invitation is on your account"}
      </h1>

      <p className="type-body mt-3 text-text-secondary">
        {needsPassword ? (
          <>
            {first.cooperativeName} added you as its {first.title ?? first.role} on Clarix. Set a
            password and the account is yours.
          </>
        ) : (
          <>
            {first.cooperativeName} added you as its {first.title ?? first.role}. Your existing
            Clarix account gains this role — nothing else about it changes, and your other
            cooperatives are unaffected.
          </>
        )}
      </p>

      {invites.length > 1 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id} className="type-secondary text-text-secondary">
              {invite.cooperativeName} — {invite.title ?? invite.role}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">Your email address</Label>
          <Input id="invite-email" value={email} readOnly disabled />
          <p className="type-caption text-text-muted">
            The invitation was issued to this address, so it cannot be changed here.
          </p>
        </div>

        {needsPassword ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-password">Set your password</Label>
              <div className="relative">
                <Input
                  id="invite-password"
                  type={revealed ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setRevealed((current) => !current)}
                  aria-label={revealed ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-text-muted transition-colors duration-150 hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
                >
                  {revealed ? (
                    <EyeOff className="size-4" aria-hidden strokeWidth={2} />
                  ) : (
                    <Eye className="size-4" aria-hidden strokeWidth={2} />
                  )}
                </button>
              </div>
              <p className="type-caption text-text-muted">At least 8 characters.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-confirm">Confirm your password</Label>
              <Input
                id="invite-confirm"
                type={revealed ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
          </>
        ) : null}
      </div>

      <Button className="mt-8 w-full" disabled={pending} onClick={submit}>
        {pending
          ? "Working…"
          : needsPassword
            ? "Activate account"
            : "Add this role to my account"}
        {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
      </Button>

      <p className="type-caption mt-6 text-text-muted">
        <Link
          href="/login"
          className="text-text-secondary underline-offset-4 transition-colors duration-150 hover:text-text hover:underline"
        >
          This wasn&apos;t meant for me
        </Link>{" "}
        — nothing is activated until you choose to.
      </p>
    </div>
  );
}
