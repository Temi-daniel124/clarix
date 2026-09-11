"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Clock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { springStandard } from "@/lib/motion";
import { applyToCooperativeAction, type ApplyState } from "./actions";

const INITIAL: ApplyState = {};

/**
 * "Apply to join" — blueprint 4.4.
 *
 * This is now the ONLY place in the product that creates a membership. Onboarding step 2.5 used
 * to apply inline from its own list, which meant two different apply paths that could drift
 * apart; it now opens this screen instead.
 *
 * The application lands as pending, so the button becomes "Request sent" rather than claiming a
 * membership the cooperative has not granted. Clarix does not decide who becomes a member.
 */
export function ApplyButton({
  cooperativeId,
  cooperativeName,
  membershipStatus,
  returnTo,
}: {
  cooperativeId: string;
  cooperativeName: string;
  membershipStatus: "pending" | "active" | "suspended" | null;
  returnTo: string | null;
}) {
  const reduceMotion = useReducedMotion();
  const [state, formAction, pending] = useActionState(applyToCooperativeAction, INITIAL);

  const status = state.applied ? "pending" : membershipStatus;

  if (status === "active") {
    return (
      <p className="flex items-center gap-2 type-body text-emerald">
        <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden />
        You are a member of {cooperativeName}.
      </p>
    );
  }

  if (status === "pending") {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : springStandard}
      >
        <Button disabled className="w-full sm:w-auto">
          <Clock className="size-4" strokeWidth={2} aria-hidden />
          Request sent
        </Button>
        <p className="type-secondary mt-3 max-w-[440px] text-text-secondary">
          {cooperativeName} has your application and will review it themselves. It appears under
          My cooperatives in the meantime.
        </p>

        {returnTo === "onboarding" ? (
          <Button variant="ghost" className="mt-4" render={<Link href="/onboarding/cooperatives" />}>
            <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
            Back to setting up
          </Button>
        ) : null}
      </motion.div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="cooperativeId" value={cooperativeId} />
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending…" : "Apply to join"}
      </Button>
    </form>
  );
}
