"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MeterBar } from "@/components/clarix/meter-bar";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { clampRatio, formatFullDate, formatNaira } from "@/lib/format";
import { completeLoanAction } from "@/app/admin/loan-actions";
import type { RepaymentEntry } from "@/lib/supabase/admin-loans";

/** Seconds before the close is written, matching the decision pattern next to it. */
const UNDO_SECONDS = 8;

/**
 * Loan Detail for a loan that is running (admin blueprint 6.4), and the one action that ends it.
 *
 * The progress meter is the same used-against-a-limit motif as everywhere else, here reading
 * repaid against borrowed, and the repayment history beneath it is the record those figures come
 * from rather than a separate claim about them.
 *
 * Closing uses the same Timed Undo as approving, and for a stronger reason than symmetry: an
 * active loan holds part of this member's deduction cap at every cooperative they belong to, so
 * closing one hands capacity back everywhere at once. That is not a change worth making on a
 * mis-tap, and it is not one this screen can quietly reverse afterwards.
 */
export function LoanClose({
  loanId,
  memberName,
  requestedAmount,
  monthlyRepayment,
  repaid,
  repayments,
  canClose,
}: {
  loanId: string;
  memberName: string;
  requestedAmount: number;
  monthlyRepayment: number;
  repaid: number;
  repayments: RepaymentEntry[];
  canClose: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [note, setNote] = useState("");
  const noteRef = useRef("");
  const [pending, setPending] = useState(false);
  const [countdown, setCountdown] = useState(UNDO_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ releasedMonthly: number } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const outstanding = Math.max(requestedAmount - repaid, 0);
  const shortOfLedger = outstanding > 0;

  const commit = useCallback(() => {
    startTransition(async () => {
      const result = await completeLoanAction(loanId, noteRef.current);

      if (result.error) {
        setPending(false);
        setError(result.error);
        return;
      }

      setDone({ releasedMonthly: result.completed?.releasedMonthly ?? monthlyRepayment });
      router.refresh();
    });
  }, [loanId, monthlyRepayment, router]);

  useEffect(() => {
    if (!pending) return;

    timer.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          if (timer.current) clearInterval(timer.current);
          commit();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pending, commit]);

  return (
    <div className="mt-6 rounded-feature border border-border bg-surface p-5 md:p-6">
      <h2 className="type-section text-text">Repayment so far</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="type-caption text-text-muted">Recorded against this loan</p>
          <RollingNumber value={repaid} className="type-kpi mt-2 text-text" />
        </div>
        <div>
          <p className="type-caption text-text-muted">Borrowed</p>
          <p className="type-kpi tabular mt-2 text-text">{formatNaira(requestedAmount)}</p>
        </div>
      </div>

      <div className="mt-5">
        <MeterBar
          size="compact"
          track="neutral"
          usedRatio={requestedAmount > 0 ? clampRatio(repaid / requestedAmount) : 1}
          label={`${formatNaira(repaid)} repaid of ${formatNaira(requestedAmount)}`}
        />
      </div>

      <p className="type-secondary mt-3 text-text-secondary">
        {shortOfLedger
          ? `${formatNaira(outstanding)} of this loan has no repayment recorded against it yet.`
          : "Every naira of this loan has a repayment recorded against it."}
      </p>

      {repayments.length > 0 ? (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="type-caption uppercase tracking-[0.08em] text-text-muted">
            Repayments recorded
          </h3>
          <ul className="mt-3 divide-y divide-border">
            {repayments.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="type-secondary text-text-secondary">
                  {formatFullDate(entry.recordedAt)}
                </span>
                <span className="type-secondary tabular text-text">
                  {formatNaira(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
          {repayments.length > 8 ? (
            <p className="type-caption mt-3 text-text-muted">
              Showing the most recent 8 of {repayments.length}.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 border-t border-border pt-5">
        {done ? (
          <>
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-card text-emerald"
              style={{
                backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
              }}
            >
              <CheckCheck className="size-5" strokeWidth={2.5} />
            </span>
            <h3 className="type-section mt-5 text-text">Closed</h3>
            <p className="type-body mt-2 max-w-[520px] text-text-secondary">
              {formatNaira(done.releasedMonthly)} a month is no longer committed against{" "}
              {memberName}&rsquo;s salary. That capacity is theirs again at every cooperative they
              belong to, not only this one.
            </p>
          </>
        ) : !canClose ? (
          <p className="type-body text-text-secondary">
            Closing a loan is not switched on for your account. Somebody who can decide loans here
            can mark this one repaid in full.
          </p>
        ) : pending ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="type-card-title text-text">Closing in {countdown}&hellip;</p>
              <p className="type-secondary mt-1 text-text-secondary">
                Nothing has been written yet.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (timer.current) clearInterval(timer.current);
                setPending(false);
                setCountdown(UNDO_SECONDS);
              }}
            >
              <Undo2 className="size-4" aria-hidden strokeWidth={2} />
              Undo
            </Button>
          </div>
        ) : (
          <>
            <h3 className="type-section text-text">Is this loan finished?</h3>
            <p className="type-body mt-2 max-w-[560px] text-text-secondary">
              Marking it repaid in full releases {formatNaira(monthlyRepayment)} a month from{" "}
              {memberName}&rsquo;s deduction limit, everywhere. Until then Clarix keeps counting it,
              which is what stops two cooperatives lending against the same salary twice.
            </p>

            {shortOfLedger ? (
              <div className="mt-4">
                <label htmlFor="close-note" className="type-caption text-text-muted">
                  {formatNaira(outstanding)} is unaccounted for in the ledger. What happened?
                </label>
                <Textarea
                  id="close-note"
                  className="mt-2"
                  rows={2}
                  placeholder="Settled directly at the office, and receipted."
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    noteRef.current = event.target.value;
                  }}
                />
                <p className="type-caption mt-2 text-text-muted">
                  Kept in the audit log with the closure, so the gap has an explanation next to it.
                </p>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="type-secondary mt-4 text-danger">
                {error}
              </p>
            ) : null}

            <Button
              className="mt-5"
              onClick={() => {
                setError(null);
                setCountdown(UNDO_SECONDS);
                setPending(true);
              }}
            >
              <CheckCheck className="size-4" aria-hidden strokeWidth={2} />
              Mark repaid in full
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
