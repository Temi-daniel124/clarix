"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Clock, Minus, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapacityMeter } from "@/components/clarix/capacity-meter";
import { MeterBar } from "@/components/clarix/meter-bar";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { cn } from "@/lib/utils";
import { clampRatio, formatDayMonth, formatNaira } from "@/lib/format";
import { previewEligibility } from "@/lib/eligibility";
import { springStandard } from "@/lib/motion";
import { submitLoanApplicationAction, type SubmitState } from "./actions";

const INITIAL: SubmitState = {};

export type ApplyProduct = {
  id: string;
  name: string;
  minSavingsRatio: number;
  maxTenureMonths: number;
  interestTerms: string | null;
};

export type ApplyTarget = {
  membershipId: string;
  cooperativeId: string;
  cooperativeName: string;
  savingsBalance: number;
  products: ApplyProduct[];
};

/**
 * Loan Application (blueprint 5.5).
 *
 * "The screen where the product's core promise is delivered directly to the employee": a live,
 * honest answer about whether a loan fits, before they commit to requesting it.
 *
 * There are two separate questions here, and the admin blueprint insists they stay separate:
 * whether the repayment fits inside the employer's deduction cap, and whether the member has
 * saved enough to satisfy the cooperative's own rule for the product they are asking for. The
 * first is the same arithmetic every screen in Clarix shows; the second belongs to this
 * cooperative alone, and until the product picker below existed it was never asked at all.
 *
 * The comparison panel updates on every slider move, and it updates LOCALLY: the same
 * `previewEligibility` from src/lib/eligibility.ts that the unit tests cover, run against the
 * capacity figure the server already sent. That keeps the readout instant and, more importantly,
 * means moving a slider never touches the database. Only pressing Submit does, and only through
 * the locked transaction, which recomputes both checks server-side rather than trusting any of
 * the figures drawn here.
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

  // The default when there is a choice: the product asking least of a member's savings, which is
  // the one most of them qualify for. Named and selected in the list below rather than applied
  // invisibly, so the rule being measured against is always on screen.
  const ordered = useMemo(
    () => [...target.products].sort((a, b) => a.minSavingsRatio - b.minSavingsRatio),
    [target.products],
  );

  // How far the amount slider runs: the most this member's remaining capacity could repay over
  // the product's longest tenure.
  //
  // It deliberately is NOT the savings ratio, which is what bounded this slider before. Capping
  // the amount at savings ÷ ratio meant the savings rule could never be broken, so the check
  // below could never fail and the member was silently stopped from even asking. That is
  // gatekeeping, and blueprint 5.5 asks for the opposite. Both checks are now reachable: the
  // savings one by asking for more than the balance supports, the capacity one by shortening the
  // tenure until the monthly repayment outruns what is left.
  const available = Math.max(cap - committed, 0);
  const boundFor = (row: ApplyProduct | null) =>
    Math.max(50_000, Math.min(5_000_000, Math.floor(available * (row?.maxTenureMonths ?? 12))));

  const [productId, setProductId] = useState<string | null>(ordered[0]?.id ?? null);
  const product = ordered.find((row) => row.id === productId) ?? null;

  const maxTenure = product?.maxTenureMonths ?? 36;
  const sliderMax = boundFor(product);

  const [amount, setAmount] = useState(() => Math.min(100_000, boundFor(ordered[0] ?? null)));
  const [tenure, setTenure] = useState(() => Math.min(12, ordered[0]?.maxTenureMonths ?? 12));

  // Switching product can leave the amount or the tenure past what the new one allows, and the
  // server refuses both outright. Correcting them here, as part of the choice itself, keeps the
  // submission from failing on a bound the member was never shown.
  const chooseProduct = (row: ApplyProduct) => {
    setProductId(row.id);
    setAmount((value) => Math.min(value, boundFor(row)));
    setTenure((value) => Math.min(value, row.maxTenureMonths));
  };

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

  // The second check. Same arithmetic the server runs and the reviewer sees.
  const requiredSavings = product ? Math.round(amount * product.minSavingsRatio * 100) / 100 : null;
  const savingsShortfall =
    requiredSavings === null ? null : Math.max(requiredSavings - target.savingsBalance, 0);
  const meetsSavings = savingsShortfall === null ? true : savingsShortfall <= 0;

  const flagged = !preview.eligible || !meetsSavings;

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
        {productId ? <input type="hidden" name="loanProductId" value={productId} /> : null}

        {/*
          The picker, and only when there is something to pick. One product is not a choice, and a
          cooperative that has configured none is not a reason to show an empty control.
        */}
        {ordered.length > 1 ? (
          <fieldset className="mt-10">
            <legend className="type-caption uppercase tracking-[0.08em] text-text-muted">
              Which loan?
            </legend>

            <div className="mt-3 flex flex-col gap-2">
              {ordered.map((row) => (
                <label
                  key={row.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors duration-150",
                    row.id === productId
                      ? "border-emerald/50 bg-surface"
                      : "border-border bg-surface hover:border-text-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="product"
                    value={row.id}
                    checked={row.id === productId}
                    onChange={() => chooseProduct(row)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--clarix-brand-accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block type-body text-text">{row.name}</span>
                    <span className="mt-1 block type-caption text-text-muted">
                      {Math.round(row.minSavingsRatio * 100)}% of the amount must already be
                      saved, up to {row.maxTenureMonths} months
                      {row.interestTerms ? `. ${row.interestTerms}` : "."}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {ordered.length === 1 && product ? (
          <p className="mt-10 type-secondary text-text-secondary">
            <span className="text-text">{product.name}</span> is the only loan{" "}
            {target.cooperativeName} offers, so this application is for that.
          </p>
        ) : null}

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

        {/* The live comparison against the employer's cap. */}
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
          And the cooperative's own rule, kept visibly separate from the cap above because they
          answer different questions and can disagree: a request can sit comfortably inside the
          salary limit and still be short of what this cooperative asks you to have saved.
        */}
        {product && requiredSavings !== null && savingsShortfall !== null ? (
          <section
            className="mt-4 rounded-feature border border-border bg-surface p-5 md:p-6"
            aria-live="polite"
          >
            <h2 className="type-section text-text">{target.cooperativeName}&rsquo;s savings rule</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="type-caption text-text-muted">Saved with them</p>
                <p className="type-card-title tabular mt-1 text-text">
                  {formatNaira(target.savingsBalance)}
                </p>
              </div>
              <div>
                <p className="type-caption text-text-muted">
                  {product.name} requires {Math.round(product.minSavingsRatio * 100)}%
                </p>
                <p className="type-card-title tabular mt-1 text-text">
                  {formatNaira(requiredSavings)}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <MeterBar
                size="compact"
                track="neutral"
                usedRatio={
                  requiredSavings > 0
                    ? clampRatio(target.savingsBalance / requiredSavings)
                    : 1
                }
                label={`${formatNaira(target.savingsBalance)} saved against ${formatNaira(requiredSavings)} required`}
              />
            </div>

            <p className={cn("mt-3 type-secondary", meetsSavings ? "text-emerald" : "text-warning")}>
              {meetsSavings
                ? "You meet their savings requirement for this loan."
                : `${formatNaira(savingsShortfall)} short of what they ask you to have saved.`}
            </p>
          </section>
        ) : null}

        {/*
          The button stays enabled either way. Clarix informs, it does not gatekeep, but the
          label changes so nobody submits a request that failed either check without being told.
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
            {pending ? "Sending…" : flagged ? "Submit anyway" : "Submit application"}
            {pending ? null : <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />}
          </Button>
        </motion.div>

        {flagged ? (
          <p className="type-caption mt-3 text-text-secondary">
            You can still send this. {target.cooperativeName} decides whether to approve it, and
            they will see the same figures you are seeing
            {!preview.eligible && !meetsSavings
              ? ", both the limit and their savings rule."
              : !preview.eligible
                ? "."
                : ", their savings rule included."}
          </p>
        ) : null}
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
  // Two checks, either of which can flag an application without stopping it.
  const savingsShort = result.meetsSavingsRatio === false;
  const clean = result.eligible && !savingsShort;

  return (
    <div className="py-6">
      <span
        aria-hidden
        className={cn(
          "flex size-12 items-center justify-center rounded-card",
          clean ? "text-emerald" : "text-warning",
        )}
        style={{
          backgroundColor: clean
            ? "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)"
            : "color-mix(in srgb, var(--clarix-warning) 14%, transparent)",
        }}
      >
        {clean ? (
          <Check className="size-6" strokeWidth={2.5} />
        ) : (
          <TriangleAlert className="size-6" strokeWidth={2} />
        )}
      </span>

      <h1 className="type-page-title mt-6 text-text">
        {clean ? "Application sent" : "Sent, and flagged"}
      </h1>

      <p className="type-body mt-3 max-w-[520px] text-text-secondary">
        {result.eligible ? (
          <>
            {formatNaira(result.monthlyRepayment)} a month is now held against your limit while{" "}
            {target.cooperativeName} reviews this.
          </>
        ) : (
          // D040's exact words.
          <>
            Sent to {target.cooperativeName}. It is above your limit, so nothing is held for you.
            The cooperative will decide.
          </>
        )}
      </p>

      {savingsShort && result.savingsShortfall !== null ? (
        <p className="type-body mt-3 max-w-[520px] text-warning">
          It is also {formatNaira(result.savingsShortfall)} short of the{" "}
          {formatNaira(result.savingsRequired ?? 0)} this loan asks you to have saved with them.
          That is their own rule rather than the salary limit, and it is theirs to waive or not.
        </p>
      ) : null}

      {result.eligible && result.reservationExpiresAt ? (
        <p className="type-secondary mt-4 flex items-center gap-2 text-text-muted">
          <Clock aria-hidden strokeWidth={1.75} className="size-4" />
          That hold lapses on {formatDayMonth(result.reservationExpiresAt)}{" "}
          if they have not decided by then.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href={`/loans/${result.loanId}`} />}>View this application</Button>
        <Button variant="outline" render={<Link href={`/cooperatives/${target.cooperativeId}`} />}>
          Back to {target.cooperativeName}
        </Button>
      </div>
    </div>
  );
}
