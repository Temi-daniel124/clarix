import { Chip } from "@/components/ui/chip";
import { BUILT_FOR } from "./copy";
import { cn } from "@/lib/utils";

/**
 * "Made for" band (spec §11.1, item 3): the six kinds of cooperative Clarix serves, as neutral
 * pills under the hero. It names who the product is for rather than claiming who uses it.
 */
export function BuiltFor() {
  return (
    <section
      aria-label="Made for every kind of cooperative"
      className="reveal mx-auto w-full max-w-[1240px] px-5 pt-2 pb-[72px] md:px-6 lg:pb-24"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
        <p className="mr-0.5 text-[14px] font-semibold text-muted max-sm:w-full max-sm:text-center">
          Made for
        </p>
        <ul role="list" className="contents">
          {BUILT_FOR.map((kind) => (
            <li key={kind}>
              <Chip
                tone="neutral"
                className={cn(
                  "px-[18px] py-[11px] text-[15px] leading-5 font-semibold max-sm:px-3 max-sm:py-2 max-sm:text-[13px]",
                )}
              >
                {kind}
              </Chip>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
