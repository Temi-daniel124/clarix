"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { matchesEmployeeIdPattern, normaliseEmployeeId } from "@/lib/onboarding";
import { addMemberAction, type MemberActionState } from "@/app/admin/member-actions";

const INITIAL: MemberActionState = {};

/**
 * Add Member (admin blueprint 5.3).
 *
 * "The ordinary, low-drama case of one new person joining after the bulk import already ran."
 * Three fields, and the staff ID validated as it is typed against the organization's own pattern.
 * It is the same rule, from the same column, that employee onboarding validates against, so a
 * cooperative cannot record an ID the member could never match.
 *
 * What this writes is a roster entry, exactly as the import does. If that staff ID already has a
 * Clarix account they become a member immediately; if not, the entry waits for them and the
 * trigger links the two the day they join (DECISIONS.md D028).
 */
export function AddMemberForm({
  employeeIdPattern,
  employeeIdLabel,
}: {
  employeeIdPattern: string;
  employeeIdLabel: string;
}) {
  const [state, formAction, pending] = useActionState(addMemberAction, INITIAL);
  const [employeeId, setEmployeeId] = useState("");

  const touched = employeeId.length > 0;
  const valid = matchesEmployeeIdPattern(employeeId, employeeIdPattern);

  return (
    <div>
      <Button variant="tertiary" className="-ml-3" render={<Link href="/admin/members" />}>
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        Members
      </Button>

      <h1 className="type-page-title mt-6 text-text">Add a member</h1>
      <p className="type-body mt-3 max-w-[520px] text-text-secondary">
        For somebody joining after your import already ran. One person, three fields: no need to
        reopen the whole import for a single row.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="off"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="employeeId">{employeeIdLabel}</Label>
          <Input
            id="employeeId"
            name="employeeId"
            inputMode="numeric"
            value={employeeId}
            onChange={(event) => setEmployeeId(normaliseEmployeeId(event.target.value))}
            aria-invalid={Boolean(state.fieldErrors?.employeeId) || (touched && !valid)}
            className="tabular"
          />
          {touched && !valid ? (
            <p className="type-caption text-warning">
              That does not match the format {employeeIdLabel} uses here yet.
            </p>
          ) : (
            <p className="type-caption text-text-muted">
              As it appears on their payslip. It is what links them to their Clarix account.
            </p>
          )}
          <FieldError message={state.fieldErrors?.employeeId} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="savingsBalance">Opening savings balance</Label>
          <Input
            id="savingsBalance"
            name="savingsBalance"
            inputMode="decimal"
            placeholder="Optional, leave blank for zero"
            aria-invalid={Boolean(state.fieldErrors?.savingsBalance)}
            className="tabular"
          />
          <p className="type-caption text-text-muted">
            Only if they are transferring in with savings already standing to their name.
          </p>
          <FieldError message={state.fieldErrors?.savingsBalance} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={pending || !valid}>
            {pending ? "Adding…" : "Add member"}
          </Button>
          <SectionFeedback saved={state.saved} error={state.error} />
        </div>
      </form>
    </div>
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
