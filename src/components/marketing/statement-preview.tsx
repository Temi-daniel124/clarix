import { Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BRAND_COLORS, ringArc } from "@/lib/brand";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STATEMENTS } from "./copy";
import { EYEBROW, SECTION } from "./section";

/**
 * Statements, reports and exports (spec §11.1, item 7; round-2 board): a member statement drawn
 * as a sheet of paper, with the faded diagonal Clarix stamp behind its figures, beside what the
 * cooperative can produce. The statement is a preview with a sample member, not real data, so it
 * is one labelled picture to assistive technology rather than a table to read through.
 */
const ROWS = [
  { entry: "2 Sep · Saved ₦10,000", savings: 182_000, loan: 250_000 },
  { entry: "30 Sep · Repaid ₦35,000", savings: 182_000, loan: 215_000 },
  { entry: "3 Oct · Saved ₦10,000", savings: 192_000, loan: 215_000 },
  { entry: "31 Oct · Repaid ₦35,000", savings: 192_000, loan: 180_000 },
  { entry: "4 Nov · Saved ₦20,000", savings: 212_000, loan: 180_000 },
];

export function StatementPreview() {
  return (
    <section
      aria-labelledby="statements-heading"
      className={cn(SECTION, "reveal grid grid-cols-1 items-center gap-10 lg:grid-cols-12")}
    >
      <div className="order-2 flex justify-center lg:order-1 lg:col-span-6 lg:block">
        <StatementSheet />
      </div>

      <div className="order-1 flex flex-col gap-4 lg:order-2 lg:col-span-5 lg:col-start-8">
        <p className={EYEBROW}>{STATEMENTS.eyebrow}</p>
        <h2
          id="statements-heading"
          className="type-page-title text-balance text-indigo-night lg:text-[44px] lg:leading-[1.02] lg:tracking-[-0.045em]"
        >
          {STATEMENTS.heading}
        </h2>
        <ul className="flex flex-col gap-3 text-[16px] leading-[1.55] text-ink-2">
          {STATEMENTS.points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <Check
                aria-hidden
                strokeWidth={2}
                className="mt-[3px] size-[18px] shrink-0 text-indigo-600"
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StatementSheet() {
  return (
    <div
      role="img"
      aria-label="A sample member statement for Amaka Obi at Ikeja Traders Thrift, 1 June to 30 November 2026, watermarked with the Clarix stamp and a verification code"
      className="relative w-full max-w-[460px] pt-2.5 pb-5 pl-4 sm:pl-10 lg:ml-[30px] lg:h-[420px] lg:max-w-none lg:p-0"
    >
      {/* The sheet underneath, turned a little, so the statement reads as paper. */}
      <div
        aria-hidden
        className="absolute top-[30px] left-0 h-[calc(100%-40px)] w-[calc(100%-40px)] -rotate-4 rounded-[10px] bg-white shadow-flat lg:h-[360px] lg:w-[400px]"
      />

      <div
        aria-hidden
        className="relative overflow-hidden rounded-[10px] bg-white p-5 text-[12px] leading-[1.45] text-ink shadow-[0_1px_2px_rgba(14,18,48,0.06),0_30px_60px_-30px_rgba(14,18,48,0.45)] sm:p-6 lg:absolute lg:top-2.5 lg:left-10 lg:h-[390px] lg:w-[420px]"
      >
        <Watermark />

        <div className="relative flex justify-between gap-4 border-b-2 border-indigo-night pb-2.5">
          <Logo variant="horizontal" size={18} tone="color" />
          <div className="text-right">
            <p className="text-[13px] font-bold">Member statement</p>
            <p className="text-muted">1 Jun to 30 Nov 2026</p>
          </div>
        </div>

        <p className="relative py-2.5 text-ink-2">
          <b className="font-bold text-ink">Amaka Obi</b> · Ikeja Traders Thrift · No. ITT-0142
        </p>

        <div className="tabular relative grid grid-cols-[1fr_auto_auto] gap-x-3 sm:gap-x-4 gap-y-[7px]">
          <b className="font-bold">Date</b>
          <b className="text-right font-bold">Savings</b>
          <b className="text-right font-bold">Loan left</b>
          {ROWS.map((row) => (
            <Row key={row.entry} {...row} />
          ))}
        </div>

        <div className="relative mt-6 flex justify-between border-t border-indigo-100 pt-2 text-muted lg:absolute lg:inset-x-6 lg:bottom-4 lg:mt-0">
          <span>Verification code 8KQ2-71XD</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}

function Row({ entry, savings, loan }: (typeof ROWS)[number]) {
  return (
    <>
      <span className="min-w-0">{entry}</span>
      <span className="text-right">{formatNaira(savings)}</span>
      <span className="text-right">{formatNaira(loan)}</span>
    </>
  );
}

/**
 * The stamp submark's outline, faded and turned 28° behind the figures, as on every exported
 * statement (spec §11.1). Drawn from the brand geometry so it is the same ring as the logo.
 */
function Watermark() {
  const { dash, gap } = ringArc(28);
  return (
    <svg
      viewBox="0 0 148 148"
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute top-[56%] left-1/2 size-[260px] -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] opacity-[0.07] sm:size-[300px]"
    >
      <rect x="4" y="4" width="140" height="140" rx="34" fill="none" stroke={BRAND_COLORS.indigo600} strokeWidth="3" />
      <circle
        cx="74"
        cy="74"
        r="28"
        fill="none"
        stroke={BRAND_COLORS.indigo600}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        transform="rotate(-90 74 74)"
      />
    </svg>
  );
}
