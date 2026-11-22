"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { buttonVariants } from "@/components/ui/button";
import { reducedMotionTransition, springStandard } from "@/lib/motion";
import {
  estimateBill,
  formatNaira,
  MINIMUM_MONTHLY_BILL_NGN,
  normaliseMemberCount,
  PRICE_PER_ACTIVE_MEMBER_NGN,
  type BillingCycle,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { fill, PRICING } from "./copy";
import { EYEBROW, LEAD, SECTION } from "./section";
import { usePrefersReducedMotion } from "./use-hydrated-preferences";

/**
 * The pricing section with a working estimator (spec §8 pricing-widget / changeable-pricing-
 * section, §11.1 item 8; round-2 board). Clarix has one plan, so the choice is the billing cycle
 * plus a member count, never invented tiers. The arithmetic is `estimateBill` (D037), so the
 * figure here is the one billing will charge.
 *
 * On the home page its call to action is secondary (the hero's and the final card's are that
 * page's primaries). /pricing passes `showCta={false}`: its intro column carries the page's
 * primary beside the estimator, and a second button to the same place would only repeat it.
 */
const STEP = 10;
const MAX_MEMBERS = 100_000;
const DEFAULT_MEMBERS = 180;

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: PRICING.monthly },
  { value: "yearly", label: PRICING.yearly },
];

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2";

export function PricingSection() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className={cn(SECTION, "reveal scroll-mt-28")}
    >
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-6">
          <p className={EYEBROW}>{PRICING.eyebrow}</p>
          <h2 id="pricing-heading" className="type-page-title text-balance text-indigo-night">
            {PRICING.heading}
          </h2>
          <p className={cn(LEAD, "max-w-[520px]")}>{PRICING.body}</p>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <PricingEstimator />
        </div>
      </div>
    </section>
  );
}

export function PricingEstimator({ showCta = true }: { showCta?: boolean } = {}) {
  const reducedMotion = usePrefersReducedMotion();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [draft, setDraft] = useState(String(DEFAULT_MEMBERS));
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const inputId = useId();
  const pillId = useId();

  const members = normaliseMemberCount(draft);
  const { monthly, total, minimumApplied } = estimateBill(members, cycle);

  const billLabel = cycle === "yearly" ? PRICING.billYearly : PRICING.billMonthly;
  const note = minimumApplied
    ? fill(PRICING.noteMinimum, { minimum: formatNaira(MINIMUM_MONTHLY_BILL_NGN) })
    : cycle === "monthly"
      ? fill(PRICING.noteMonthly, {
          members: members.toLocaleString("en-NG"),
          price: formatNaira(PRICE_PER_ACTIVE_MEMBER_NGN),
        })
      : fill(PRICING.noteYearly, { monthly: formatNaira(monthly) });

  const atMin = members <= 0;
  const atMax = members >= MAX_MEMBERS;
  const step = (delta: number) =>
    setDraft(String(Math.min(MAX_MEMBERS, Math.max(0, members + delta))));

  // Digits only, and never past the cap, so the field always shows the count the bill is for.
  const onType = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    setDraft(digits === "" ? "" : String(Math.min(MAX_MEMBERS, Number(digits))));
  };

  // Arrow keys move the choice and the focus together, as a radio group does (WAI-ARIA APG).
  const onRadioKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;
    event.preventDefault();
    const next = (index + (forward ? 1 : CYCLES.length - 1)) % CYCLES.length;
    setCycle(CYCLES[next].value);
    radios.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-4 rounded-frame bg-white p-5 shadow-raised sm:p-6">
      <div
        role="radiogroup"
        aria-label={PRICING.cycleGroup}
        className="flex rounded-pill bg-porcelain p-[5px]"
      >
        {CYCLES.map((option, index) => {
          const checked = option.value === cycle;
          return (
            <button
              key={option.value}
              ref={(node) => {
                radios.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => setCycle(option.value)}
              onKeyDown={(event) => onRadioKey(event, index)}
              className={cn(
                "relative h-11 flex-1 rounded-pill px-3 text-[14px] font-semibold whitespace-nowrap transition-colors duration-150",
                checked ? "text-indigo-night" : "text-ink-2 hover:text-indigo-night",
                focusRing,
              )}
            >
              {checked ? (
                <motion.span
                  layoutId={pillId}
                  aria-hidden
                  transition={reducedMotion ? reducedMotionTransition : springStandard}
                  className="absolute inset-0 rounded-pill bg-white shadow-segment"
                />
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor={inputId} className="mb-2.5 block text-[14px] text-ink-2">
          {PRICING.membersLabel}
        </label>
        <div className="flex items-center justify-between gap-2 rounded-pill p-[5px] shadow-field focus-within:shadow-field-focus">
          <button
            type="button"
            aria-label={fill(PRICING.fewer, { step: STEP })}
            aria-controls={inputId}
            // aria-disabled rather than disabled: a focused button that becomes disabled would
            // drop keyboard focus to the page. It stays a focusable 44px target that does nothing.
            aria-disabled={atMin}
            onClick={() => {
              if (!atMin) step(-STEP);
            }}
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-pill bg-indigo-100 text-indigo-night transition-colors duration-150 hover:bg-indigo-100/70 aria-disabled:cursor-default aria-disabled:text-muted aria-disabled:opacity-60 aria-disabled:hover:bg-indigo-100",
              focusRing,
            )}
          >
            <Minus aria-hidden className="size-[18px]" strokeWidth={2} />
          </button>
          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="done"
            value={draft}
            onChange={(event) => onType(event.target.value)}
            onBlur={() => setDraft(String(members))}
            className="tabular h-11 min-w-0 flex-1 bg-transparent text-center font-display text-[28px] leading-none font-extrabold tracking-[-0.04em] text-indigo-night outline-none"
          />
          <button
            type="button"
            aria-label={fill(PRICING.more, { step: STEP })}
            aria-controls={inputId}
            aria-disabled={atMax}
            onClick={() => {
              if (!atMax) step(STEP);
            }}
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-pill bg-indigo-100 text-indigo-night transition-colors duration-150 hover:bg-indigo-100/70 aria-disabled:cursor-default aria-disabled:text-muted aria-disabled:opacity-60 aria-disabled:hover:bg-indigo-100",
              focusRing,
            )}
          >
            <Plus aria-hidden className="size-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-card bg-indigo-50 px-5 py-[18px]">
        <span className="font-semibold text-ink">{billLabel}</span>
        <RollingNumber
          value={total}
          className="font-display text-[34px] leading-none font-extrabold tracking-[-0.045em] text-indigo-night"
        />
      </div>

      {/* The one place the result is announced: once per change, as a sentence, rather than the
          rolling digits each reading out. */}
      <p aria-live="polite" className="tabular -mt-1.5 text-[13px] text-muted">
        <span className="sr-only">
          {billLabel}: {formatNaira(total)}.{" "}
        </span>
        {note}
      </p>

      {showCta ? (
        <Link href="/signup" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
          {PRICING.cta}
        </Link>
      ) : null}
    </div>
  );
}
