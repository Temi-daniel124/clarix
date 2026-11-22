"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Eye, EyeOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MeterBar } from "@/components/clarix/meter-bar";
import { springStandard } from "@/lib/motion";
import { classifyIdentifier, scorePassword, passwordSchema } from "@/lib/validation/auth";
import { signUpAction, type AuthFormState } from "../actions";

const INITIAL: AuthFormState = {};

/**
 * Sign Up form (employee blueprint 1.3).
 *
 * Uses the short sequential-input pattern the blueprint calls for: the contact field settles
 * first, and the password field arrives once there is something valid to attach it to. That
 * pattern is only appropriate because this step genuinely asks for two fields; the longer
 * onboarding steps that follow do not use it.
 *
 * The strength indicator reuses the product's one meter component rather than introducing a
 * second way of drawing a value against a ceiling (DESIGN_SYSTEM.md § The signature motif).
 */
export function SignUpForm() {
  const reduceMotion = useReducedMotion();
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const identifierKind = classifyIdentifier(identifier);
  const identifierReady = identifierKind !== "unknown";
  const strength = useMemo(() => scorePassword(password), [password]);
  const passwordReady = passwordSchema.safeParse(password).success;

  const canSubmit = identifierReady && passwordReady && accepted && !pending;

  // React resets the form's DOM once a form action settles. The text inputs are controlled by
  // `value` and are restored on the next render, but a checkbox's `checked` is not reapplied
  // unless its state actually changes, so after a failed submit the box appeared unticked
  // while the form still considered consent given. Re-asserting the DOM from state after every
  // render keeps what the employee sees and what the form believes the same thing.
  const consentRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (consentRef.current && consentRef.current.checked !== accepted) {
      consentRef.current.checked = accepted;
    }
  });

  const strengthTone =
    strength.score <= 1 ? "exceeded" : strength.score === 2 ? "tight" : "healthy";

  return (
    <div>
      <h1 className="type-page-title text-text">Create your Clarix account</h1>
      <p className="type-body mt-3 text-text-secondary">
        One account, however many cooperatives you belong to.
      </p>

      {state.error ? <FormError message={state.error} reduceMotion={Boolean(reduceMotion)} /> : null}

      <form action={formAction} className="mt-8 flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="identifier">Email address</Label>
          <Input
            id="identifier"
            name="identifier"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors?.identifier)}
            aria-describedby={state.fieldErrors?.identifier ? "identifier-error" : undefined}
          />
          {state.fieldErrors?.identifier ? (
            <FieldError id="identifier-error" message={state.fieldErrors.identifier} />
          ) : null}
        </div>

        {/* The second field arrives once the first has something valid in it. */}
        <AnimatePresence initial={false}>
          {identifierReady ? (
            <motion.div
              key="password"
              initial={reduceMotion ? false : { opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, height: 0 }}
              transition={reduceMotion ? { duration: 0 } : springStandard}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={revealed ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="pr-12"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(state.fieldErrors?.password)}
                    aria-describedby="password-strength"
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

                {/* The label sits under the bar rather than beside it: "Enter a password" and
                    "Very strong" are different enough in length that any fixed-width column
                    either wraps or leaves a gap. */}
                <div className="mt-1 flex flex-col gap-2" id="password-strength">
                  <MeterBar
                    size="compact"
                    usedRatio={0}
                    proposedRatio={strength.score / 4}
                    tone={strengthTone}
                    track="neutral"
                    label="Password strength"
                  />
                  <span className="type-caption text-text-secondary">{strength.label}</span>
                </div>

                {state.fieldErrors?.password ? (
                  <FieldError id="password-error" message={state.fieldErrors.password} />
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Plain-language data-use confirmation, not a wall of legal text. */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="dataUseAccepted"
            className="flex cursor-pointer items-start gap-3 type-secondary text-text-secondary"
          >
            <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
              <input
                id="dataUseAccepted"
                ref={consentRef}
                name="dataUseAccepted"
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="peer size-5 cursor-pointer appearance-none rounded-[6px] border-2 border-text-muted bg-surface transition-colors duration-150 hover:border-text-secondary checked:border-emerald checked:bg-emerald focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
              />
              <Check
                aria-hidden
                strokeWidth={3}
                className="pointer-events-none absolute size-3.5 text-white opacity-0 peer-checked:opacity-100"
              />
            </span>

            <span>
              I understand Clarix will store my income figure, the payslip behind it and my staff
              ID to work out my limit, and that each cooperative only ever sees its own
              records.{" "}
              <Link href="/privacy" className="text-indigo underline underline-offset-2">
                Read the full privacy notice
              </Link>
              .
            </span>
          </label>

          {state.fieldErrors?.dataUseAccepted ? (
            <FieldError id="consent-error" message={state.fieldErrors.dataUseAccepted} />
          ) : null}
        </div>

        <Button type="submit" disabled={!canSubmit} className="w-full">
          {pending ? "Creating your account…" : "Create account"}
          {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
        </Button>
      </form>

      <p className="type-secondary mt-8 text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="type-caption text-danger" role="alert">
      {message}
    </p>
  );
}

function FormError({ message, reduceMotion }: { message: string; reduceMotion: boolean }) {
  return (
    <motion.p
      role="alert"
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : springStandard}
      className="mt-6 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
      style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
      {message}
    </motion.p>
  );
}
