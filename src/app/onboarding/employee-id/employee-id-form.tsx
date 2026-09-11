"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { springStandard } from "@/lib/motion";
import { matchesEmployeeIdPattern, normaliseEmployeeId } from "@/lib/onboarding";
import { saveEmployeeIdAction, type StepState } from "../actions";

const INITIAL: StepState = {};

/**
 * Employee ID Entry — blueprint 2.2.
 *
 * A single-focus screen: one instructional line, one large field, and a helper line saying where
 * to find the number. The field confirms itself the moment it holds a valid value rather than
 * waiting for a submission to report an error — being told you were right is worth more here
 * than being told, after the fact, that you were wrong.
 *
 * The pattern comes from the organization record, so the rule is the employer's, not the app's.
 */
export function EmployeeIdForm({
  label,
  pattern,
  hint,
}: {
  label: string;
  pattern: string;
  hint: string;
}) {
  const reduceMotion = useReducedMotion();
  const [state, formAction, pending] = useActionState(saveEmployeeIdAction, INITIAL);
  const [value, setValue] = useState("");

  const valid = matchesEmployeeIdPattern(value, pattern);
  const fieldError = state.fieldErrors?.employeeId;

  return (
    <div className="pt-10">
      <h1 className="type-page-title text-text">What is your {label}?</h1>
      <p className="type-body mt-3 text-text-secondary">
        This is what lets your cooperatives find you, and it is the number your salary is paid
        against.
      </p>

      {state.error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="mt-10" noValidate>
        <Label htmlFor="employeeId" className="sr-only">
          {label}
        </Label>

        <div className="relative">
          <Input
            id="employeeId"
            name="employeeId"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="000000"
            value={value}
            onChange={(event) => setValue(normaliseEmployeeId(event.target.value))}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "employee-id-error" : "employee-id-hint"}
            className="h-16 pr-14 text-center text-[28px] font-700 tracking-[0.28em] tabular md:text-[32px]"
            style={{ fontWeight: 700 }}
          />

          {/* Confirms as soon as the value is valid, rather than after a failed submit. */}
          {valid && !fieldError ? (
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduceMotion ? { duration: 0 } : springStandard}
              className="absolute inset-y-0 right-4 flex items-center text-emerald"
              aria-hidden
            >
              <Check className="size-5" strokeWidth={3} />
            </motion.span>
          ) : null}
        </div>

        {fieldError ? (
          <p id="employee-id-error" role="alert" className="mt-3 type-secondary text-danger">
            {fieldError}
          </p>
        ) : (
          <p id="employee-id-hint" className="mt-3 type-caption text-text-muted">
            {hint}
          </p>
        )}

        <Button type="submit" disabled={!valid || pending} className="mt-10 w-full">
          {pending ? "Saving…" : "Continue"}
          {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
        </Button>
      </form>
    </div>
  );
}
