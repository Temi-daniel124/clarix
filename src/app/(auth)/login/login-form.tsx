"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { springStandard } from "@/lib/motion";
import { logInAction, type AuthFormState } from "../actions";
import { demoSignInAction } from "../demo-actions";

const INITIAL: AuthFormState = {};

/**
 * Log In form (employee blueprint 1.4).
 *
 * The same shell as Sign Up, two fields, and no strength indicator: this is not account
 * creation. Both fields are shown at once rather than sequentially, because a returning user
 * is filling in something they already know rather than composing it.
 */
export function LogInForm({ demoRoles = [] }: { demoRoles?: { role: string; label: string }[] }) {
  const reduceMotion = useReducedMotion();
  const [state, formAction, pending] = useActionState(logInAction, INITIAL);
  const [revealed, setRevealed] = useState(false);
  const [demoPending, startDemo] = useTransition();
  const [demoChoice, setDemoChoice] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const error = demoError ?? state.error;

  return (
    <div>
      <h1 className="type-page-title text-text">Sign in to Clarix</h1>
      <p className="type-body mt-3 text-text-secondary">
        Your cooperatives, your deductions, and what is left of your limit.
      </p>

      {error ? (
        <motion.p
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : springStandard}
          className="mt-6 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {error}
        </motion.p>
      ) : null}

      <form action={formAction} className="mt-8 flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="identifier">Email address</Label>
          <Input
            id="identifier"
            name="identifier"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            aria-invalid={Boolean(state.fieldErrors?.identifier)}
            aria-describedby={state.fieldErrors?.identifier ? "identifier-error" : undefined}
          />
          {state.fieldErrors?.identifier ? (
            <p id="identifier-error" role="alert" className="type-caption text-danger">
              {state.fieldErrors.identifier}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>

          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            revealed={revealed}
            onRevealedChange={setRevealed}
          />

          {state.fieldErrors?.password ? (
            <p id="password-error" role="alert" className="type-caption text-danger">
              {state.fieldErrors.password}
            </p>
          ) : null}

          <Link
            href="/reset-password"
            className="mt-1 w-fit type-caption text-indigo underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={pending || demoPending} className="w-full">
          {pending ? "Signing you in…" : "Sign in"}
          {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
        </Button>
      </form>

      {/*
        D048: one-tap demo accounts, only where the owner switched demo mode on and never in
        Production. The server decides which chips exist and holds the passwords; a chip sends
        nothing but its role.
      */}
      {demoRoles.length > 0 ? (
        <div className="mt-4">
          <p id="demo-sign-in-label" className="type-small text-ink-500">
            Sign in as
          </p>
          <div role="group" aria-labelledby="demo-sign-in-label" className="mt-2 flex flex-wrap gap-2">
            {demoRoles.map(({ role, label }) => (
              <Button
                key={role}
                type="button"
                variant="secondary"
                loading={demoPending && demoChoice === role}
                disabled={pending || (demoPending && demoChoice !== role)}
                onClick={() => {
                  setDemoError(null);
                  setDemoChoice(role);
                  startDemo(async () => {
                    const result = await demoSignInAction(role);
                    if (result?.error) setDemoError(result.error);
                  });
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <p className="type-secondary mt-8 text-text-secondary">
        New to Clarix?{" "}
        <Link href="/signup" className="text-indigo underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
