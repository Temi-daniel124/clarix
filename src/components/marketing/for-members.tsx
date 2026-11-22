import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  HandCoins,
  Lock,
  Receipt,
  Search,
  WalletCards,
} from "lucide-react";
import { MeterBar } from "@/components/clarix/meter-bar";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { fill, FOR_MEMBERS_PAGE } from "./copy";
import { EYEBROW, LEAD, SECTION } from "./section";

/**
 * /for-members' sections (spec §11.1 For members, §11.4 member onboarding; D038). There is no
 * board for this page, so it is built from the landing's parts and the round-2 member boards:
 * the hero's photo frame with a real product card over its edge (here the member's own figure
 * card, R2-Member), numbered step cards each ending in a piece of the join flow (R2-Onboard),
 * a list group of the member's cooperatives, and a closing ring-pattern card.
 *
 * "Find your cooperative" is the page's one primary. It opens the page and closes it, each in a
 * viewport of its own, as the landing's trial button does; nothing else on the page is primary.
 */
const PAGE = FOR_MEMBERS_PAGE;

// R2-Member's Amaka: the same limit and commitments the landing's cross-check shows.
const LIMIT = 161_838;
const COMMITTED = 60_975;
const STILL_FREE = LIMIT - COMMITTED;

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2";

function FindCooperativeButton() {
  return (
    <Link href={PAGE.ctaHref} className={cn(buttonVariants({ size: "lg" }), "max-sm:w-full")}>
      {PAGE.cta}
      <ArrowRight className="size-[18px]" strokeWidth={2} aria-hidden />
    </Link>
  );
}

function SignInLink() {
  return (
    <Link
      href="/login"
      className={cn(
        buttonVariants({ variant: "tertiary", size: "lg" }),
        "text-indigo-600 max-sm:w-full",
      )}
    >
      {PAGE.signIn}
    </Link>
  );
}

export function MembersIntro() {
  return (
    <section
      aria-labelledby="members-heading"
      className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-5 pt-10 pb-[72px] md:px-6 md:pt-14 lg:grid-cols-12 lg:pb-24"
    >
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-6">
        <p className={EYEBROW}>{PAGE.eyebrow}</p>
        <h1 id="members-heading" className="type-page-title text-balance text-indigo-night">
          {PAGE.heading}
        </h1>
        <p className={cn(LEAD, "max-w-[540px]")}>{PAGE.body}</p>
        <div className="flex flex-wrap gap-3">
          <FindCooperativeButton />
          <SignInLink />
        </div>
        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-2 type-body-s text-ink-2">
          {PAGE.ticks.map((tick) => (
            <li key={tick} className="flex items-center gap-2">
              <Check className="size-[18px] text-emerald-700" strokeWidth={2} aria-hidden />
              {tick}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative min-w-0 lg:col-span-6 lg:pb-9 lg:pl-9">
        <div className="relative h-[380px] overflow-hidden rounded-frame bg-indigo-100 shadow-frame lg:h-[560px]">
          <Image
            src="/images/landing/market.jpg"
            alt={PAGE.photoAlt}
            fill
            preload
            sizes="(min-width: 1240px) 584px, (min-width: 1024px) 48vw, 100vw"
            className="object-cover"
            style={{ objectPosition: "50% 35%" }}
          />
        </div>
        <div className="relative mx-4 -mt-24 lg:absolute lg:bottom-0 lg:left-0 lg:m-0 lg:w-[360px]">
          <MemberFigureCard />
        </div>
      </div>
    </section>
  );
}

/**
 * The member's figure card (spec §6, kind 1), as R2-Member draws it: what she can still take on
 * each month over the signature meter, with the source of her limit under it. A picture of the
 * product, so it is one labelled image to assistive technology.
 */
function MemberFigureCard() {
  return (
    <div
      role="img"
      aria-label={PAGE.preview.label}
      className="ring-pattern flex flex-col gap-3 rounded-feature bg-white p-5 shadow-raised"
    >
      <p className="type-body-s font-semibold text-ink-2">{PAGE.preview.figureLabel}</p>
      <RollingNumber
        value={STILL_FREE}
        className="font-display type-figure-xl-s leading-none font-extrabold tracking-[-0.05em] text-indigo-night"
      />
      <div className="rounded-group bg-indigo-50 p-3">
        <MeterBar usedRatio={COMMITTED / LIMIT} className="h-2.5" />
        <div className="tabular mt-2 flex justify-between gap-3 type-caption leading-normal text-ink-2">
          <span>
            {PAGE.preview.committed} {formatNaira(COMMITTED)}
          </span>
          <span>
            {PAGE.preview.limit} {formatNaira(LIMIT)}
          </span>
        </div>
      </div>
      <p className="type-caption leading-[1.4] text-muted">{PAGE.preview.source}</p>
    </div>
  );
}

/**
 * How to join (spec §11.4): find the cooperative, add income evidence, get approved. Three
 * numbered cards as on the landing's repayment steps, each ending in a small, real piece of the
 * join flow. The pieces are pictures, hidden from assistive technology; the text says it all.
 */
export function JoinSteps() {
  return (
    <section aria-labelledby="join-heading" className={cn(SECTION, "reveal scroll-mt-28")}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 lg:mb-10">
        <h2 id="join-heading" className="type-section-title max-w-[680px] text-balance text-indigo-night">
          {PAGE.stepsHeading}
        </h2>
        <p className={cn(LEAD, "max-w-[420px]")}>{PAGE.stepsBody}</p>
      </div>

      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PAGE.steps.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col gap-3.5 rounded-feature bg-white p-6 shadow-flat"
          >
            <span
              aria-hidden
              className={cn(
                "grid size-10 place-items-center rounded-pill font-display type-body font-extrabold",
                index === 2 ? "bg-emerald-50 text-emerald-700" : "bg-indigo-100 text-indigo-600",
              )}
            >
              {index + 1}
            </span>
            <h3 className="type-feature-title text-indigo-night">
              <span className="sr-only">{fill(PAGE.stepPrefix, { n: index + 1 })}</span>
              {step.title}
            </h3>
            <p className="type-body-m leading-[1.55] text-ink-2">{step.body}</p>
            <div aria-hidden className="mt-auto pt-1">
              {index === 0 ? <SearchPiece /> : null}
              {index === 1 ? <EvidencePiece /> : null}
              {index === 2 ? <ApprovalPiece /> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const S = PAGE.stepSamples;

/** The cooperative search with its one result. */
function SearchPiece() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-11 items-center gap-2.5 rounded-input bg-white px-3.5 type-body text-ink shadow-field-focus">
        <Search className="size-[18px] text-muted" strokeWidth={2} />
        {S.search}
      </div>
      <div className="flex items-center gap-3 rounded-group bg-porcelain p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-indigo-100 type-caption leading-normal font-bold text-indigo-600">
          {PAGE.preview.cooperatives[0].initials}
        </span>
        <div className="min-w-0">
          <p className="truncate type-body-s leading-snug font-semibold text-ink">{S.result}</p>
          <p className="truncate type-caption leading-snug text-muted">{S.resultMeta}</p>
        </div>
      </div>
    </div>
  );
}

/** R2-Onboard's three ways to give a limit, bank statements chosen, with its privacy line. */
function EvidencePiece() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-group bg-porcelain p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded-[6px] bg-white type-caption-s font-extrabold text-red-600 shadow-flat">
            PDF
          </span>
          <div className="min-w-0">
            <p className="truncate type-body-s leading-snug font-semibold text-ink">{S.file}</p>
            <p className="type-caption leading-snug font-semibold text-emerald-700">{S.fileMeta}</p>
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2 px-1 type-caption leading-[1.4] text-ink-2">
        <Lock className="mt-px size-[15px] shrink-0 text-indigo-600" strokeWidth={2} />
        {S.privacy}
      </p>
    </div>
  );
}

/** The application, waiting on the cooperative's decision. */
function ApprovalPiece() {
  return (
    <div className="flex flex-col items-start gap-2.5 rounded-group bg-porcelain p-3.5">
      <Chip tone="waiting">{S.waiting}</Chip>
      <p className="type-body-s leading-snug font-semibold text-ink">{S.application}</p>
    </div>
  );
}

const SEE_ICONS = [WalletCards, HandCoins, Receipt, FileText] as const;

/**
 * What a member sees (spec §11.1 For members, §11.5): the four things the member app is for,
 * beside the cooperatives list group from R2-Member, and who can open the member's documents
 * (D031, D038).
 */
export function MemberView() {
  return (
    <section
      aria-labelledby="member-view-heading"
      className={cn(SECTION, "reveal grid grid-cols-1 items-start gap-10 lg:grid-cols-12")}
    >
      <div className="flex flex-col gap-4 lg:col-span-6">
        <h2
          id="member-view-heading"
          className="type-section-title text-balance text-indigo-night"
        >
          {PAGE.seeHeading}
        </h2>
        <p className={cn(LEAD, "max-w-[520px]")}>{PAGE.seeBody}</p>
        <ul className="mt-2 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {PAGE.see.map((point, index) => {
            const Icon = SEE_ICONS[index];
            return (
              <li key={point.title} className="flex flex-col gap-1.5">
                <Icon aria-hidden className="mb-1 size-[22px] text-indigo-600" strokeWidth={2} />
                <h3 className="type-body-m leading-[1.3] font-semibold text-indigo-night">
                  {point.title}
                </h3>
                <p className="type-body leading-[1.55] text-ink-2">{point.body}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:col-start-8">
        <CooperativesList />
        <div className="flex gap-3 rounded-card bg-white p-5 shadow-flat">
          <Lock aria-hidden className="mt-0.5 size-5 shrink-0 text-indigo-600" strokeWidth={2} />
          <div className="flex flex-col gap-1.5">
            <h3 className="type-body-m leading-[1.35] font-semibold text-indigo-night">
              {PAGE.privacyHeading}
            </h3>
            <p className="type-body leading-[1.55] text-ink-2">{PAGE.privacyBody}</p>
            <Link
              href="/privacy"
              className={cn(
                "-ml-1 inline-flex min-h-11 items-center self-start rounded-tag px-1 type-body font-semibold text-indigo-600 underline-offset-4 hover:underline",
                focusRing,
              )}
            >
              {PAGE.privacyLink}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A list group (spec §6, kind 3) of the member's cooperatives, as R2-Member shows them. */
function CooperativesList() {
  return (
    <div
      role="img"
      aria-label={`${PAGE.preview.cooperativesTitle}: ${PAGE.preview.cooperatives
        .map((coop) => `${coop.name}, ${PAGE.preview.savings.toLowerCase()} ${formatNaira(coop.savings)}`)
        .join("; ")}`}
      className="overflow-hidden rounded-card bg-white shadow-flat"
    >
      <p className="px-5 pt-4 pb-2 type-label leading-normal font-semibold text-ink-2">
        {PAGE.preview.cooperativesTitle}
      </p>
      <ul className="divide-y divide-line">
        {PAGE.preview.cooperatives.map((coop) => (
          <li key={coop.name} className="flex items-center gap-3 px-5 py-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-indigo-100 type-label leading-normal font-bold text-indigo-600">
              {coop.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate type-body leading-snug font-semibold text-ink">{coop.name}</p>
              <p className="tabular type-label font-normal leading-snug text-muted">
                {PAGE.preview.savings} {formatNaira(coop.savings)}
              </p>
            </div>
            {coop.loan ? <Chip tone="draft">{PAGE.preview.loan}</Chip> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Free, always" and the closing call to action: the final card's ring-pattern surface, with the
 * page's primary repeated as the only primary in this part of the page. No "Start free trial":
 * that is the cooperative's action, not the member's.
 */
export function FreeAlways() {
  return (
    <section
      aria-labelledby="free-heading"
      className="reveal mx-auto w-full max-w-[1240px] px-5 pb-14 md:px-6 lg:pb-[72px]"
    >
      <div className="ring-pattern flex flex-wrap items-center justify-between gap-8 rounded-frame bg-white p-6 shadow-flat sm:p-10 lg:flex-nowrap lg:p-14">
        <div className="min-w-0 max-w-[620px]">
          <h2 id="free-heading" className="type-cta-title mb-2.5 text-balance text-indigo-night">
            {PAGE.freeHeading}
          </h2>
          <p className={LEAD}>{PAGE.freeBody}</p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-3 sm:w-auto">
          <FindCooperativeButton />
        </div>
      </div>
    </section>
  );
}
