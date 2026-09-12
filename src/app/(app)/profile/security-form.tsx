"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "./section-feedback";
import { changePasswordAction, type SectionState } from "./actions";

const INITIAL: SectionState = {};

/**
 * Security — blueprint 6.2, third section.
 *
 * Changing a password is the one action on this screen where the current value has to be proved
 * as well as the new one chosen, so it asks for three fields rather than two. The reveal toggle
 * matches the one on the sign-in screen, which is where an employee first met it.
 */
export function SecurityForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, INITIAL);
  const [revealed, setRevealed] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
        />
        <FieldError message={state.fieldErrors?.currentPassword} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={revealed ? "text" : "password"}
            autoComplete="new-password"
            className="pr-12"
            aria-invalid={Boolean(state.fieldErrors?.newPassword)}
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
        <FieldError message={state.fieldErrors?.newPassword} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={revealed ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
        <FieldError message={state.fieldErrors?.confirmPassword} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Changing…" : "Change password"}
        </Button>
        <SectionFeedback saved={state.saved} error={state.error} />
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="type-caption text-danger">
      {message}
    </p>
  );
}
