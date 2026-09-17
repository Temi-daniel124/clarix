"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import { decideLoanAction } from "@/app/admin/loan-actions";

/** Seconds an admin has to take a decision back before anything is written. */
const UNDO_SECONDS = 8;

/**
 * Approve / Reject (admin blueprint 6.2).
 *
 * The Timed Undo pattern the blueprint asks for, and implemented the honest way round: the
 * countdown runs BEFORE the write, not after it. Nothing reaches the database and no notification
 * reaches the member until the window closes, so "undo" genuinely undoes rather than compensating
 * for something already done.
 *
 * The two actions are deliberately separated rather than stacked as a primary/danger pair,
 * mis-tapping the wrong one here costs a member their loan or a cooperative its money.
 *
 * Over-cap approvals require a reason. The field is not decoration: the database refuses the
 * approval without it, and what gets typed here lands in `audit_log.note` where a reviewer can
 * find it later.
 */
export function LoanDecision({
  loanId,
  memberName,
  monthlyRepayment,
  availableBefore,
  overCap,
  canDecide,
}: {
  loanId: string;
  memberName: string;
  monthlyRepayment: number;
  availableBefore: number | null;
  overCap: boolean;
  canDecide: boolean;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [, startTransition] = useTransition();

  const [note, setNote] = useState("");
  // Read through a ref at commit time so typing does not restart the countdown.
  const noteRef = useRef("");
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [countdown, setCountdown] = useState(UNDO_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ status: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const commit = useCallback(
    (decision: "approve" | "reject") => {
      startTransition(async () => {
        const result = await decideLoanAction(loanId, decision, noteRef.current);

        if (result.error) {
          setPending(null);
          setError(result.error);
          return;
        }

        setDone({ status: result.decided?.status ?? "" });
        router.refresh();
      });
    },
    [loanId, router],
  );

  // The countdown is started by the click that begins a decision, not by this effect: the effect
  // only owns the interval, so nothing sets state during render.
  useEffect(() => {
    if (!pending) return;

    timer.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          commit(pending);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pending, commit]);

  const begin = (decision: "approve" | "reject") => {
    setError(null);
    setCountdown(UNDO_SECONDS);
    setPending(decision);
  };

  if (done) {
    const approved = done.status === "active";

    return (
      <div className="rounded-feature border border-border bg-surface p-6 md:p-8">
        <span
          aria-hidden
          className={cn(
            "flex size-11 items-center justify-center rounded-card",
            approved ? "text-emerald" : "text-text-secondary",
          )}
          style={{
            backgroundColor: approved
              ? "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)"
              : "color-mix(in srgb, var(--clarix-text-muted) 14%, transparent)",
          }}
        >
          {approved ? <Check className="size-5" strokeWidth={2.5} /> : <X className="size-5" strokeWidth={2.5} />}
        </span>

        <h2 className="type-section mt-5 text-text">
          {approved ? "Approved" : "Turned down"}
        </h2>
        <p className="type-body mt-2 max-w-[520px] text-text-secondary">
          {approved
            ? `${formatNaira(monthlyRepayment)} a month is now committed against ${memberName}'s salary, and they have been told.`
            : `The hold on ${memberName}'s capacity is released, and they have been told. That capacity is free for their other requests straight away.`}
        </p>
      </div>
    );
  }

  if (!canDecide) {
    return (
      <div className="rounded-feature border border-border bg-surface p-6">
        <p className="type-body text-text">
          Deciding loans is not switched on for your account.
        </p>
        <p className="type-secondary mt-2 max-w-[480px] text-text-secondary">
          You can read everything on this page, which is most of what a decision needs. An admin
          at this cooperative grants the decision itself, from Officers under Manage cooperative.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-feature border border-border bg-surface p-6 md:p-8">
      <h2 className="type-section text-text">Your decision</h2>

      {overCap ? (
        <div className="mt-5">
          <label htmlFor="decision-note" className="type-secondary font-medium text-text">
            Why are you approving beyond what is left of their limit?
          </label>
          <Textarea
            id="decision-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              noteRef.current = event.target.value;
            }}
            disabled={pending !== null}
            placeholder="A sentence is enough. It is recorded against this decision."
            className="mt-2 min-h-24"
          />
          <p className="type-caption mt-2 max-w-[520px] text-text-muted">
            This request is {formatNaira(monthlyRepayment)} a month against{" "}
            {formatNaira(availableBefore ?? 0)} of room. Approving is your cooperative&apos;s call
            to make. Clarix records the reason rather than blocking it.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-5 type-secondary text-danger">
          {error}
        </p>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.div
            key="pending"
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : springStandard}
            className="mt-6 flex flex-wrap items-center gap-4 rounded-card border border-border bg-background px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <p className="type-card-title text-text">
                {pending === "approve" ? "Approving" : "Turning down"} in {countdown}…
              </p>
              <p className="type-secondary mt-1 text-text-secondary">
                Nothing has been written yet. {memberName} is told once this finishes.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                if (timer.current) clearInterval(timer.current);
                setPending(null);
              }}
            >
              <Undo2 className="size-4" aria-hidden strokeWidth={2} />
              Undo
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Deliberately far apart: these are not a default and its danger twin. */}
            <Button
              variant={overCap ? "danger" : "primary"}
              disabled={overCap && note.trim().length < 3}
              onClick={() => begin("approve")}
            >
              <Check className="size-4" aria-hidden strokeWidth={2.5} />
              {overCap ? "Approve anyway" : "Approve"}
            </Button>

            <Button
              variant="outline"
              onClick={() => begin("reject")}
            >
              <X className="size-4" aria-hidden strokeWidth={2} />
              Reject
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {overCap && note.trim().length < 3 && !pending ? (
        <p className="type-caption mt-3 text-text-muted">
          Write the reason first and Approve anyway becomes available.
        </p>
      ) : null}
    </div>
  );
}
