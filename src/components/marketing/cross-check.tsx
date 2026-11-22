import { MeterBar } from "@/components/clarix/meter-bar";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { CROSS_CHECK, fill } from "./copy";
import { formatNaira } from "@/lib/format";
import { LEAD, SECTION, EYEBROW } from "./section";

/**
 * The check only Clarix can do (spec §11.1, item 5; round-2 board). The explanation sits on the
 * ring-pattern card, and beside it the figure card a committee actually sees: the figure that is
 * still free, over the signature meter, with what is committed, this request and what is left.
 *
 * The member is the hero's Amaka, so the two figures on the page agree: a ₦161,838 limit, 37.7%
 * already committed across her cooperatives, this request 17.6%, and ₦72,363 still free.
 */
const LIMIT = 161_838;
const COMMITTED = 60_975;
const REQUEST = 28_500;
const STILL_FREE = 72_363;

const LEGEND = [
  { key: "committed", label: CROSS_CHECK.legend.committed, value: COMMITTED, swatch: "bg-indigo-600" },
  { key: "request", label: CROSS_CHECK.legend.request, value: REQUEST, swatch: "bg-ochre-500" },
  { key: "available", label: CROSS_CHECK.legend.available, value: STILL_FREE, swatch: "bg-emerald-500" },
] as const;

export function CrossCheck() {
  return (
    <section aria-labelledby="cross-check-heading" className={cn(SECTION, "reveal")}>
      <div className="ring-pattern grid grid-cols-1 items-center gap-8 rounded-frame bg-white p-5 shadow-flat sm:p-8 lg:grid-cols-12 lg:gap-10 lg:p-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <p className={EYEBROW}>{CROSS_CHECK.eyebrow}</p>
          <h2
            id="cross-check-heading"
            className="type-section-title text-balance text-indigo-night"
          >
            {CROSS_CHECK.heading}
          </h2>
          <p className={LEAD}>{CROSS_CHECK.body}</p>
        </div>

        {/* The figure card (spec §6, kind 1). */}
        <div className="flex min-w-0 flex-col gap-4 rounded-feature bg-white p-5 shadow-raised sm:p-7 lg:col-span-6 lg:col-start-7">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="tabular text-[16px] font-semibold text-ink">{CROSS_CHECK.request}</p>
            <Chip tone="confirmed" className="text-[13px]">
              {CROSS_CHECK.verdict}
            </Chip>
          </div>

          <p className="flex flex-wrap items-baseline gap-x-1.5 text-indigo-night">
            <RollingNumber
              value={STILL_FREE}
              className="type-figure-xl tracking-[-0.05em]"
            />
            <span className="text-[17px] font-medium text-muted">{CROSS_CHECK.figureSuffix}</span>
          </p>

          <div className="rounded-group bg-indigo-50 p-4">
            <MeterBar
              usedRatio={COMMITTED / LIMIT}
              proposedRatio={REQUEST / LIMIT}
              className="h-3.5"
              label={fill(CROSS_CHECK.meterLabel, { limit: formatNaira(LIMIT) })}
            />
            <dl className="tabular mt-3.5 grid grid-cols-1 gap-2 text-[13.5px] sm:grid-cols-3 sm:gap-3">
              {LEGEND.map((entry) => (
                <div key={entry.key} className="min-w-0 max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-3">
                  <dt className="flex items-center gap-[7px] leading-snug text-ink-2">
                    <span aria-hidden className={cn("size-[9px] shrink-0 rounded-[3px]", entry.swatch)} />
                    {entry.label}
                  </dt>
                  <dd className="sm:mt-0.5">
                    <RollingNumber
                      value={entry.value}
                      className="text-[16px] font-bold text-ink sm:text-[18px]"
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="text-[13.5px] leading-[1.5] text-muted">{CROSS_CHECK.footnote}</p>
        </div>
      </div>
    </section>
  );
}
