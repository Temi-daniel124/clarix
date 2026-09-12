"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { updatePersonalInfoAction, type SectionState } from "./actions";

const INITIAL: SectionState = {};

/**
 * Personal information — blueprint 6.2, first section.
 *
 * Name and contact details only. The staff ID is not editable here on purpose: it is unique
 * within the organization and is what a cooperative matches an employee against, so changing it
 * is a correction someone else has to make, not a preference. It is shown in the summary above
 * instead, where it reads as a fact about the account rather than a field.
 */
export function PersonalInfoForm({
  name,
  email,
  phone,
}: {
  name: string | null;
  email: string | null;
  phone: string | null;
}) {
  const [state, formAction, pending] = useActionState(updatePersonalInfoAction, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name ?? ""}
          autoComplete="name"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={email ?? ""}
          autoComplete="email"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="Optional"
          defaultValue={phone ?? ""}
          autoComplete="tel"
          aria-invalid={Boolean(state.fieldErrors?.phone)}
        />
        <FieldError message={state.fieldErrors?.phone} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Save changes"}
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
