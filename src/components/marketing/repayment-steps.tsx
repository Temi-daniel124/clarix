import { Chip } from "@/components/ui/chip";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fill, REPAYMENT_INTRO, REPAYMENT_SAMPLES, REPAYMENT_STEPS } from "./copy";
import { LEAD, SECTION } from "./section";

/**
 * "A repayment, from bank transfer to statement" (spec §11.1, item 4; round-2 board): three
 * numbered task cards, each ending in a small, real piece of the product at that step. The
 * pieces are pictures of the product, not controls, so they are hidden from assistive technology
 * and nothing in them can be pressed; the step text says what they show.
 */
export function RepaymentSteps() {
  return (
    <section id="how-it-works" className={cn(SECTION, "reveal scroll-mt-28")}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 lg:mb-10">
        <h2 className="type-page-title max-w-[680px] text-balance text-indigo-night">
          {REPAYMENT_INTRO.heading}
        </h2>
        <p className={cn(LEAD, "max-w-[400px]")}>{REPAYMENT_INTRO.body}</p>
      </div>

      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {REPAYMENT_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col gap-3.5 rounded-feature bg-white p-6 shadow-flat"
          >
            <span
              aria-hidden
              className={cn(
                "grid size-10 place-items-center rounded-pill font-display type-body font-extrabold",
                index === 2
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-indigo-100 text-indigo-600",
              )}
            >
              {index + 1}
            </span>
            <h3 className="type-feature-title text-indigo-night">
              <span className="sr-only">
                {fill(REPAYMENT_SAMPLES.stepPrefix, { n: index + 1 })}
              </span>
              {step.title}
            </h3>
            <p className="type-body-m leading-[1.55] text-ink-2">{step.body}</p>
            <div aria-hidden className="mt-auto pt-1">
              {index === 0 ? <ReceiptPiece /> : null}
              {index === 1 ? <DecisionPiece /> : null}
              {index === 2 ? <BalancePiece /> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The member's attached receipt, waiting for the treasurer. */
function ReceiptPiece() {
  return (
    <div className="flex items-center gap-3 rounded-group bg-porcelain p-3.5">
      {/* A paper thumbnail: ruled lines on a white slip. */}
      <span className="flex h-[54px] w-[42px] shrink-0 flex-col justify-evenly rounded-[8px] bg-white px-1.5 shadow-flat">
        {[0, 1, 2, 3, 4, 5].map((line) => (
          <span key={line} className="block h-px bg-line" />
        ))}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate type-body-s leading-snug font-semibold text-ink">
          {REPAYMENT_SAMPLES.receiptFile}
        </p>
        <p className="tabular type-caption leading-snug text-muted">
          {fill(REPAYMENT_SAMPLES.receiptMeta, { amount: formatNaira(25_000) })}
        </p>
      </div>
      <Chip tone="waiting">{REPAYMENT_SAMPLES.waiting}</Chip>
    </div>
  );
}

/**
 * The treasurer's two answers, drawn as the product draws them. They are a picture here, not
 * buttons: the page's one real primary in this part of the page is elsewhere, so Confirm takes
 * the emerald fill without the primary-float lift that marks a live primary action.
 */
function DecisionPiece() {
  const pill =
    "flex h-11 flex-1 items-center justify-center rounded-pill type-body font-semibold";
  return (
    <div className="flex gap-2">
      <span className={cn(pill, "bg-emerald-500 text-on-emerald")}>{REPAYMENT_SAMPLES.confirm}</span>
      <span className={cn(pill, "bg-indigo-100 text-indigo-night")}>{REPAYMENT_SAMPLES.sendBack}</span>
    </div>
  );
}

/** The loan balance the moment the repayment is confirmed. */
function BalancePiece() {
  return (
    <div className="tabular flex items-baseline justify-between gap-3 rounded-group bg-porcelain px-4 py-3.5">
      <span className="type-body-s text-ink-2">{REPAYMENT_SAMPLES.loanLeft}</span>
      <span className="flex items-baseline gap-2">
        <span className="type-body-s text-muted line-through">{formatNaira(205_000)}</span>
        <RollingNumber
          value={180_000}
          className="font-display type-figure-s leading-none font-extrabold tracking-[-0.04em] text-indigo-night"
        />
      </span>
    </div>
  );
}
