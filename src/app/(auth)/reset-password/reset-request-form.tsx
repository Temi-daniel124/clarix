"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestResetAction, type ResetState } from "./actions";

const INITIAL: ResetState = {};

/**
 * Forgot password, first half.
 *
 * The confirmation says the same thing whether or not the address has an account, which is the
 * point rather than vagueness: a screen that answered "no such account" would tell anybody who
 * asked which of a cooperative's staff use Clarix.
 */
export function ResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestResetAction, INITIAL);

  if (state.sent) {
    return (
      <div>
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-card text-emerald"
          style={{
            backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
          }}
        >
          <MailCheck className="size-6" strokeWidth={1.75} />
        </span>

        <h1 className="type-page-title mt-6 text-text">Check that inbox</h1>
        <p className="type-body mt-3 max-w-[420px] text-text-secondary">
          If that address has a Clarix account, a link to set a new password is on its way. It
          works once and lasts an hour.
        </p>

        <p className="type-caption mt-4 max-w-[420px] text-text-muted">
          Nothing arrived? Clarix cannot deliver mail to every address yet, because its sending
          domain is still being verified. If you are waiting on this, ask whoever set your account
          up to reset it for you.
        </p>

        <Button variant="outline" className="mt-8" render={<Link href="/login" />}>
          <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="type-page-title text-text">Forgot your password?</h1>
      <p className="type-body mt-3 max-w-[420px] text-text-secondary">
        Enter the address you sign in with and we will send a link to set a new one.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          />
          {state.fieldErrors?.email ? (
            <p id="email-error" role="alert" className="type-caption text-danger">
              {state.fieldErrors.email}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send the link"}
          {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
        </Button>
      </form>

      <p className="type-secondary mt-8 text-text-secondary">
        Remembered it?{" "}
        <Link href="/login" className="text-indigo underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
