"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chooseNewPasswordAction, type ResetState } from "../actions";

const INITIAL: ResetState = {};

/**
 * Forgot password, second half: the screen the emailed link lands on.
 *
 * No current-password field, deliberately. Control of the mailbox is what was proved to get here,
 * and asking for a password the person has by definition forgotten would make this screen useless
 * to the only people who ever reach it. The same reveal toggle as sign-in, which is where they
 * first met it.
 */
export function ChoosePasswordForm({ expired = false }: { expired?: boolean }) {
  const [state, formAction, pending] = useActionState(chooseNewPasswordAction, INITIAL);
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <h1 className="type-page-title text-text">Set a new password</h1>
      <p className="type-body mt-3 max-w-[420px] text-text-secondary">
        Choose something you have not used elsewhere. Once it saves you will be signed in.
      </p>

      {expired && !state.error ? (
        <p role="alert" className="mt-6 rounded-card border border-danger/40 px-4 py-3 type-secondary text-danger">
          This link has expired or was already used. Ask for a fresh one below.
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className="mt-6 rounded-card border border-danger/40 px-4 py-3 type-secondary text-danger">
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={revealed ? "text" : "password"}
              autoComplete="new-password"
              className="pr-12"
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              aria-label={revealed ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-card text-text-muted transition-colors duration-150 hover:text-text focus-visible:outline-2 focus-visible:outline-indigo"
            >
              {revealed ? (
                <EyeOff className="size-4" aria-hidden strokeWidth={2} />
              ) : (
                <Eye className="size-4" aria-hidden strokeWidth={2} />
              )}
            </button>
          </div>
          {state.fieldErrors?.password ? (
            <p id="password-error" role="alert" className="type-caption text-danger">
              {state.fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Type it again</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={revealed ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            aria-describedby={state.fieldErrors?.confirmPassword ? "confirm-error" : undefined}
          />
          {state.fieldErrors?.confirmPassword ? (
            <p id="confirm-error" role="alert" className="type-caption text-danger">
              {state.fieldErrors.confirmPassword}
            </p>
          ) : null}
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving…" : "Save and sign in"}
          {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
        </Button>
      </form>

      <p className="type-secondary mt-8 text-text-secondary">
        Link stopped working?{" "}
        <Link href="/reset-password" className="text-indigo underline underline-offset-2">
          Ask for a fresh one
        </Link>
      </p>
    </div>
  );
}
