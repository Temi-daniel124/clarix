"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Clock, Minus, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapacityMeter } from "@/components/clarix/capacity-meter";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { previewEligibility } from "@/lib/eligibility";
import { springStandard } from "@/lib/motion";
import { submitLoanApplicationAction, type SubmitState } from "./actions";

const INITIAL: SubmitState = {};

export type ApplyTarget = {
  membershipId: string;
  cooperativeId: string;
  cooperativeName: string;
  savingsBalance: number;
  products: Array<{
    id: string;
    name: string;
    minSavingsRatio: number;
    maxTenureMonths: number;
  }>;
};

/**
 * Loan Application (blueprint 5.5).
 *
 * "The screen where the product's core promise is delivered directly to the employee": a live,
 * honest answer about whether a loan fits, before they commit to requesting it.
 *
 * The comparison panel updates on every slider move, and it updates LOCALLY: the same
 * `previewEligibility` from src/lib/eligibility.ts that the unit tests cover, run against the
 * capacity figure the server already sent. That keeps the readout instant and, more importantly,
 * means moving a slider never touches the database. Only pressing Submit does, and only through
 * the locked transaction.
 *
 * The result uses CapacityMeter, the same component the cooperative's own staff will see. The
 * admin blueprint is explicit that both sides must see the same visual result, and that shared
 * picture is itself the trust signal.
 */
export function ApplicationForm({
  target,
  cap,
  committed,
}: {
  target: ApplyTarget;
  cap: number;
  committed: number;
}) {
  const reduceMotion = useReducedMotion();
  const [state, formAction, pending] = useActionState(submitLoanApplicationAction, INITIAL);

  const maxTenure = Math.max(...target.products.map((p) => p.maxTenureMonths), 12);
  const [amount, setAmount] = useState(100_000);
  const [tenure, setTenure] = useState(12);

  // The cooperative's own bound: the product with the gentlest savings requirement decides the
  // most an employee with this balance could ask for.
  const bestRatio = useMemo(
    () => Math.min(...target.products.map((p) => p.minSavingsRatio), 1),
    [target.products],
  );
  const maxBySavings = bestRatio > 0 ? Math.floor(target.savingsBalance / bestRatio) : 0;
  const sliderMax = Math.max(50_000, Math.min(5_000_000, maxBySavings || 1_000_000));

  const preview = previewEligibility({
    salary: { gross: null, net: null },
    policy: { basis: "gross", maxPercentage: 0 },
    committedMonthlyRepayments: committed,
    requestedMonthlyRepayment: Math.round((amount / tenure) * 100) / 100,
    // The cap is already computed server-side from the organization's policy; passing it through
    // keeps one source of truth for the figure rather than recomputing salary maths here.
    capOverride: cap,
  });

  const monthly = preview.requestedMonthlyRepayment;

  if (state.submitted) {
    return <SubmittedPanel result={state.submitted} target={target} />;
  }

  return (
    <div>
      <p className="type-caption uppercase tracking-[0.08em] text-text-muted">Applying to</p>
      <h1 className="type-page-title mt-1 text-text">{target.cooperativeName}</h1>

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

      <form action={formAction}>
        <input type="hidden" name="membershipId" value={target.membershipId} />
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="tenureMonths" value={tenure} />

        {/* Amount */}
        <section className="mt-10">
          <label htmlFor="amount-slider" className="type-caption uppercase tracking-[0.08em] text-text-muted">
            How much do you need?
          </label>

          <div className="mt-3">
            <RollingNumber value={amount} className="type-kpi text-text" />
          </div>

          <input
            id="amount-slider"
            type="range"
            min={10_000}
            max={sliderMax}
            step={5_000}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="clarix-slider mt-5 w-full"
            aria-valuetext={formatNaira(amount)}
          />

          <div className="mt-2 flex justify-between type-caption text-text-muted">
            <span>{formatNaira(10_000)}</span>
            <span>{formatNaira(sliderMax)}</span>
          </div>
        </section>

        {/* Tenure */}
        <section className="mt-10">
          <span className="type-caption uppercase tracking-[0.08em] text-text-muted">
            Over how many months?
          </span>

          <div className="mt-3 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Fewer months"
              disabled={tenure <= 1}
              onClick={() => setTenure((value) => Math.max(1, value - 1))}
            >
              <Minus className="size-4" strokeWidth={2.5} />
            </Button>

            <span className="type-kpi tabular w-16 text-center text-text" aria-live="polite">
              {tenure}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More months"
              disabled={tenure >= maxTenure}
              onClick={() => setTenure((value) => Math.min(maxTenure, value + 1))}
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </Button>

            <span className="type-secondary text-text-secondary">
              months, up to {maxTenure}
            </span>
          </div>
        </section>

        {/* The live comparison. */}
        <section
          className="mt-10 rounded-feature border border-border bg-surface p-5 md:p-6"
          aria-live="polite"
        >
          <CapacityMeter
            cap={cap}
            committed={committed}
            proposed={monthly}
            showVerdict
            caption={
              preview.eligible
                ? `If this is approved, ${formatNaira(preview.headroom)} of your monthly limit would still be free.`
                : `This request is ${formatNaira(preview.shortfall)} a month beyond what is left of your limit.`
            }
          />

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5">
            <div>
              <dt className="type-caption text-text-muted">Requested deduction</dt>
              <dd className="type-card-title tabular mt-1 text-text">{formatNaira(monthly)}</dd>
            </div>
            <div>
              <dt className="type-caption text-text-muted">A month, for</dt>
              <dd className="type-card-title tabular mt-1 text-text">{tenure} months</dd>
            </div>
          </dl>
        </section>

        {/*
          The button stays enabled either way. Clarix informs, it does not gatekeep, but the
          label changes so nobody submits an over-limit request without having been told.
        */}
        <motion.div
          initial={false}
          animate={reduceMotion ? undefined : { scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : springStandard}
          className="mt-8"
        >
          <Button
            type="submit"
            variant={preview.eligible ? "primary" : "danger"}
            disabled={pending}
            className="w-full"
          >
            {pending
              ? "Sending…"
              : preview.eligible
                ? "Submit application"
                : "Submit anyway"}
            {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
          </Button>
        </motion.div>

        {preview.eligible ? null : (
          <p className="type-caption mt-3 text-text-secondary">
            You can still send this. {target.cooperativeName} decides whether to approve it, and
            they will see the same figures you are seeing.
          </p>
        )}
      </form>
    </div>
  );
}

function SubmittedPanel({
  result,
  target,
}: {
  result: NonNullable<SubmitState["submitted"]>;
  target: ApplyTarget;
}) {
  return (
    <div className="py-6">
      <span
        aria-hidden
        className={cn(
          "flex size-12 items-center justify-center rounded-card",
          result.eligible ? "text-emerald" : "text-warning",
        )}
        style={{
          backgroundColor: result.eligible
            ? "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)"
            : "color-mix(in srgb, var(--clarix-warning) 14%, transparent)",
        }}
      >
        {result.eligible ? (
          <Check className="size-6" strokeWidth={2.5} />
        ) : (
          <TriangleAlert className="size-6" strokeWidth={2} />
        )}
      </span>

      <h1 className="type-page-title mt-6 text-text">
        {result.eligible ? "Application sent" : "Sent, and flagged"}
      </h1>

      <p className="type-body mt-3 max-w-[520px] text-text-secondary">
        {result.eligible ? (
          <>
            {formatNaira(result.monthlyRepayment)} a month is now held against your limit while{" "}
            {target.cooperativeName} reviews this.
          </>
        ) : (
          <>
            {target.cooperativeName} has your application. Because it is{" "}
            {formatNaira(result.shortfall)} a month beyond what is left of your limit, nothing has
            been held against your capacity, and they will see that when they review it.
          </>
        )}
      </p>

      {result.eligible && result.reservationExpiresAt ? (
        <p className="type-secondary mt-4 flex items-center gap-2 text-text-muted">
          <Clock aria-hidden strokeWidth={1.75} className="size-4" />
          That hold lapses on {new Date(result.reservationExpiresAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
          })}{" "}
          if they have not decided by then.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href="/loans" />}>View my loans</Button>
        <Button variant="outline" render={<Link href={`/cooperatives/${target.cooperativeId}`} />}>
          Back to {target.cooperativeName}
        </Button>
      </div>
    </div>
  );
}
