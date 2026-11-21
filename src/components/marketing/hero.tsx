import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MeterBar } from "@/components/clarix/meter-bar";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { SUPPORT_EMAIL } from "@/lib/support";
import { cn } from "@/lib/utils";
import { HeroCarousel } from "./hero-carousel";
import { HeroTilt } from "./hero-tilt";

/**
 * The landing hero (spec §7 and §11.1), as drawn on the round-2 landing board.
 *
 * Light, per D033: the headline sits on porcelain, and the photography lives in a radius-32 frame
 * beside it with two real product cards floating over its edge. The second card is the
 * signature motif itself, a rolling figure over the meter, measured against a member's limit.
 *
 * On desktop it is a 12-column grid with the copy and the frame six columns each. On mobile the
 * frame stacks under the copy at 420 tall and the cards, the frame's width less 32, straddle its
 * bottom edge.
 */

const TICKS = [
  "No card needed",
  "Members always free",
  "Export everything, any time",
];

const WALKTHROUGH_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "Clarix walkthrough",
)}`;

// The board's member: committed across three cooperatives, this request, and what is left.
const LIMIT = 161_838;
const COMMITTED_RATIO = 0.377;
const REQUEST_RATIO = 0.176;
const STILL_AVAILABLE = 72_363;

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-5 pt-10 pb-10 md:px-6 md:pt-14 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-6">
        <span className="inline-flex items-center gap-2 self-start rounded-pill bg-indigo-100 py-[7px] pr-3.5 pl-3.5 text-[14px] sm:pl-2 font-semibold text-indigo-600">
          <span className="rounded-pill bg-indigo-600 px-[9px] max-sm:hidden py-0.5 text-[12px] font-bold text-white">
            New
          </span>
          For every kind of cooperative, salaried or not
        </span>

        <h1 className="type-display text-balance text-indigo-night lg:text-[72px] lg:leading-[0.98]">
          Run your cooperative with every number in view.
        </h1>

        <p className="max-w-[540px] type-body-lg text-ink-2">
          Savings, loans, repayments and member statements in one place. Before
          a loan is approved, Clarix checks what the member already owes in
          every cooperative they belong to.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "max-sm:w-full")}
          >
            Start your 60-day free trial
            <ArrowRight className="size-[18px]" strokeWidth={2} aria-hidden />
          </Link>
          <a
            href={WALKTHROUGH_HREF}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "text-indigo-night max-sm:w-full",
            )}
          >
            Book a walkthrough
          </a>
        </div>

        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] text-ink-2">
          {TICKS.map((tick) => (
            <li key={tick} className="flex items-center gap-2">
              <Check
                className="size-[18px] text-emerald-700"
                strokeWidth={2}
                aria-hidden
              />
              {tick}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 lg:col-span-6">
        <HeroTilt>
          <HeroCarousel>
            <div className="relative mx-4 -mt-16 flex flex-col gap-3 lg:static lg:m-0">
              <ConfirmedCard />
              <LimitCard />
            </div>
          </HeroCarousel>
        </HeroTilt>
      </div>
    </section>
  );
}

function ConfirmedCard() {
  return (
    <div className="flex items-center gap-3 rounded-card bg-white px-4 py-3.5 shadow-raised lg:absolute lg:top-16 lg:left-0 lg:w-[280px]">
      <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-emerald-50 text-emerald-700">
        <Check className="size-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[14.5px] leading-snug font-bold text-ink">
          Repayment confirmed
        </p>
        <p className="tabular text-[13px] leading-snug text-muted">
          ₦25,000 · Ikeja Traders Thrift
        </p>
      </div>
    </div>
  );
}

function LimitCard() {
  return (
    <div className="flex flex-col gap-2.5 rounded-card bg-white p-[18px] shadow-raised lg:absolute lg:bottom-0 lg:left-0 lg:w-[330px]">
      <div className="flex justify-between text-[13px] text-muted">
        <span>Amaka can still take on</span>
        <span className="font-bold text-emerald-700">Fits</span>
      </div>
      <p className="flex items-baseline gap-1 text-indigo-night">
        <RollingNumber
          value={STILL_AVAILABLE}
          className="font-display text-[32px] leading-none font-extrabold tracking-[-0.045em]"
        />
        <span className="text-[14px] font-medium text-muted">a month</span>
      </p>
      <div className="rounded-[12px] bg-indigo-50 p-2.5">
        <MeterBar
          usedRatio={COMMITTED_RATIO}
          proposedRatio={REQUEST_RATIO}
          className="h-2.5"
          label="Amaka's limit: committed across her cooperatives, this request, and what is left"
        />
        <div className="tabular mt-[7px] flex justify-between text-[12px] text-ink-2">
          <span>Across 3 cooperatives</span>
          <span>Limit ₦{LIMIT.toLocaleString("en-NG")}</span>
        </div>
      </div>
    </div>
  );
}
