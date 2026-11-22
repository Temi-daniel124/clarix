import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRICING_PAGE } from "./copy";
import { PricingEstimator } from "./pricing-estimator";
import { EYEBROW, LEAD, SECTION } from "./section";

/**
 * /pricing's own sections (spec §11.1 Pricing; D037). There is no board for this page, so it is
 * composed from the landing's parts: the hero's two-column opening with its ticks, the working
 * estimator, and a list group (spec §6, kind 3) for the billing terms.
 *
 * The intro column carries the page's opening primary (spec §11.1, Pricing: Start free trial), so
 * it is in the first screenful at every width; the estimator beside it drops its own button. The
 * final card's primary is far enough down that no screenful holds both.
 */
export function PricingIntro() {
  return (
    <section
      aria-labelledby="pricing-page-heading"
      className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-5 pt-10 pb-[72px] md:px-6 md:pt-14 lg:grid-cols-12 lg:pb-24"
    >
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-6">
        <p className={EYEBROW}>{PRICING_PAGE.eyebrow}</p>
        <h1
          id="pricing-page-heading"
          className="type-page-title text-balance text-indigo-night"
        >
          {PRICING_PAGE.heading}
        </h1>
        <p className={cn(LEAD, "max-w-[540px]")}>{PRICING_PAGE.body}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "max-sm:w-full")}>
            {PRICING_PAGE.cta}
            <ArrowRight className="size-[18px]" strokeWidth={2} aria-hidden />
          </Link>
        </div>
        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2 type-body-s text-ink-2">
          {PRICING_PAGE.ticks.map((tick) => (
            <li key={tick} className="flex items-center gap-2">
              <Check className="size-[18px] text-emerald-700" strokeWidth={2} aria-hidden />
              {tick}
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 lg:col-span-5 lg:col-start-8">
        <PricingEstimator showCta={false} />
      </div>
    </section>
  );
}

/**
 * What counts as active, the trial, the grace period and read-only, as a real definition list
 * in one white list group with hairlines between the rows. The read-only line is D037's: never
 * a lockout, and viewing and export always work.
 */
export function BillingTerms() {
  return (
    <section
      aria-labelledby="billing-terms-heading"
      className={cn(SECTION, "reveal grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10")}
    >
      <div className="flex flex-col gap-4 lg:col-span-5">
        <h2
          id="billing-terms-heading"
          className="type-section-title text-balance text-indigo-night"
        >
          {PRICING_PAGE.termsHeading}
        </h2>
        <p className={cn(LEAD, "max-w-[440px]")}>{PRICING_PAGE.termsBody}</p>
      </div>

      <dl className="divide-y divide-line overflow-hidden rounded-card bg-white shadow-flat lg:col-span-7">
        {PRICING_PAGE.terms.map((entry) => (
          <div
            key={entry.term}
            className="grid grid-cols-1 gap-2 px-5 py-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6 sm:px-6"
          >
            <dt className="flex flex-col items-start gap-2">
              <span className="type-body-m leading-[1.35] font-semibold text-indigo-night">
                {entry.term}
              </span>
              <span className="tabular rounded-tag bg-indigo-50 px-2.5 py-1 type-caption leading-4 font-semibold text-indigo-600">
                {entry.when}
              </span>
            </dt>
            <dd className="type-body-m leading-[1.55] text-ink-2">{entry.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
