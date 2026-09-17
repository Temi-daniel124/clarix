"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionFeedback } from "@/components/clarix/section-feedback";
import { cn } from "@/lib/utils";
import { saveDeductionPolicyAction, type PolicyState } from "@/app/platform/admin-actions";
import type { DeductionPolicy } from "@/lib/supabase/platform-admin-data";

const INITIAL: PolicyState = {};

/**
 * Deduction Policy Settings (super-admin blueprint 6.1).
 *
 * "The single most consequential screen a Super Admin touches." Two of these four fields, the
 * basis and the cap, are what every eligibility figure in Clarix is computed from, so changing
 * either moves what every member at every cooperative is told they can borrow, the instant it
 * saves.
 *
 * **The confirmation is a step, not a toast.** Changing the basis or the percentage replaces the
 * save button with a panel that names the old value and the new one and makes the operator commit
 * to that specific change. It is friction on purpose: a confirmation you can dismiss by clicking
 * where the save button used to be is not a confirmation. The server refuses the write without
 * it, so the friction cannot be posted around either.
 *
 * Changing the staff ID format or the reservation default saves directly, because neither
 * recalculates anything that already exists.
 */
export function DeductionPolicyForm({ policy }: { policy: DeductionPolicy }) {
  const [state, formAction, pending] = useActionState(saveDeductionPolicyAction, INITIAL);

  const [basis, setBasis] = useState<"gross" | "net">(policy.deductionBasis);
  const [percentage, setPercentage] = useState(String(policy.deductionMaxPercentage));
  const [label, setLabel] = useState(policy.employeeIdLabel);
  const [pattern, setPattern] = useState(policy.employeeIdPattern);
  const [expiry, setExpiry] = useState(String(policy.reservationExpiryDaysDefault));

  const [confirming, setConfirming] = useState(false);

  const eligibilityChanges = useMemo(() => {
    const changes: { field: string; from: string; to: string }[] = [];

    if (basis !== policy.deductionBasis) {
      changes.push({
        field: "Deduction basis",
        from: policy.deductionBasis === "gross" ? "Gross salary" : "Net salary",
        to: basis === "gross" ? "Gross salary" : "Net salary",
      });
    }

    if (Number(percentage) !== policy.deductionMaxPercentage) {
      changes.push({
        field: "Maximum deduction",
        from: `${policy.deductionMaxPercentage}%`,
        to: `${percentage || "0"}%`,
      });
    }

    return changes;
  }, [basis, percentage, policy]);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="type-card-title text-text">Deduction basis</legend>
        <p className="type-secondary max-w-[560px] text-text-secondary">
          Which figure on a payslip the cap is taken from. FMC Abeokuta&rsquo;s agreement is read
          against gross pay; changing this changes what every member&rsquo;s limit is a percentage
          of.
        </p>

        <div className="mt-1 flex flex-col gap-2">
          {(["gross", "net"] as const).map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors duration-150",
                basis === option
                  ? "border-emerald/50 bg-surface"
                  : "border-border bg-surface hover:border-text-muted",
              )}
            >
              <input
                type="radio"
                name="basis"
                value={option}
                checked={basis === option}
                onChange={() => setBasis(option)}
                className="mt-0.5 size-4 accent-[var(--clarix-brand-accent)]"
              />
              <span>
                <span className="block type-body text-text">
                  {option === "gross" ? "Gross salary" : "Net salary"}
                </span>
                <span className="mt-0.5 block type-caption text-text-muted">
                  {option === "gross"
                    ? "Before deductions, what the payslip states as total earnings."
                    : "After statutory deductions, what actually reaches the account."}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="percentage">Maximum deduction percentage</Label>
        <Input
          id="percentage"
          name="percentage"
          type="number"
          step="0.1"
          min="1"
          max="100"
          value={percentage}
          onChange={(event) => setPercentage(event.target.value)}
          className="max-w-[160px] tabular"
        />
        <p className="type-caption text-text-muted">
          The statutory figure is 33.3%. This is the ceiling on everything a member owes across
          every cooperative at once, not per cooperative.
        </p>
        {state.fieldErrors?.percentage ? (
          <p className="type-caption text-danger">{state.fieldErrors.percentage}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="label">What this organization calls its staff ID</Label>
        <Input
          id="label"
          name="label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="max-w-[280px]"
        />
        <Label htmlFor="pattern" className="mt-3">
          Staff ID format
        </Label>
        <Input
          id="pattern"
          name="pattern"
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          className="max-w-[280px]"
        />
        <p className="type-caption text-text-muted">
          A regular expression. The default matches a six-digit IPPIS number; it is editable in
          case Clarix ever serves an organization that is not IPPIS-based.
        </p>
        {state.fieldErrors?.pattern ? (
          <p className="type-caption text-danger">{state.fieldErrors.pattern}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expiry">Default reservation expiry</Label>
        <div className="flex items-center gap-3">
          <Input
            id="expiry"
            name="expiry"
            type="number"
            min="1"
            max="90"
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className="max-w-[120px] tabular"
          />
          <span className="type-secondary text-text-secondary">days</span>
        </div>
        <p className="type-caption text-text-muted">
          How long a cooperative may hold a member&rsquo;s capacity while deciding. Individual
          cooperatives may shorten this for themselves; none may extend it.
        </p>
        {state.fieldErrors?.expiry ? (
          <p className="type-caption text-danger">{state.fieldErrors.expiry}</p>
        ) : null}
      </div>

      {confirming && eligibilityChanges.length > 0 ? (
        <div
          className="rounded-feature border border-warning/40 p-5 md:p-6"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-warning) 7%, transparent)" }}
        >
          <div className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 text-warning">
              <TriangleAlert className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h2 className="type-card-title text-text">
                This changes the eligibility calculation for every cooperative on the platform
              </h2>
              <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
                Every member&rsquo;s available capacity is recomputed from these figures the
                moment this saves. Loans already approved are unaffected; what anybody can borrow
                next is not.
              </p>
            </div>
          </div>

          <dl className="mt-5 flex flex-col gap-2 border-t border-warning/25 pt-4">
            {eligibilityChanges.map((change) => (
              <div key={change.field} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <dt className="type-caption text-text-muted">{change.field}</dt>
                <dd className="flex items-center gap-2 type-secondary tabular text-text">
                  <span className="text-text-muted line-through">{change.from}</span>
                  <ArrowRight aria-hidden strokeWidth={2} className="size-3.5 text-text-muted" />
                  <span className="font-medium">{change.to}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="submit" name="confirmed" value="yes" disabled={pending}>
              {pending ? "Saving…" : "Yes, change it for every cooperative"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Keep it as it is
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          {eligibilityChanges.length > 0 ? (
            <Button type="button" onClick={() => setConfirming(true)}>
              Review this change
              <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          )}

          {eligibilityChanges.length > 0 ? (
            <p className="type-caption max-w-[380px] text-text-muted">
              You have changed something every cooperative&rsquo;s figures depend on, so this one
              asks before it saves.
            </p>
          ) : null}
        </div>
      )}

      <SectionFeedback saved={state.saved} error={state.error} />
    </form>
  );
}
