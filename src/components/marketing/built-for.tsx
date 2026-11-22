import { Chip } from "@/components/ui/chip";
import { BUILT_FOR, BUILT_FOR_LABEL, BUILT_FOR_REGION } from "./copy";

/**
 * "Made for" band (spec §11.1, item 3): the six kinds of cooperative Clarix serves, as neutral
 * pills under the hero. It names who the product is for rather than claiming who uses it.
 * From 1280 up the label sits above and the pills step down to body-s, so all six hold one row
 * inside the 1240 column. Below that the row wraps, as it always has on phones.
 */
export function BuiltFor() {
  return (
    <section
      aria-label={BUILT_FOR_REGION}
      className="reveal mx-auto w-full max-w-[1240px] px-5 pt-2 pb-[72px] md:px-6 lg:pb-24"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 xl:gap-2">
        <p className="mr-0.5 type-body-s font-semibold text-muted max-sm:w-full max-sm:text-center xl:mr-0 xl:w-full xl:text-center">
          {BUILT_FOR_LABEL}
        </p>
        <ul role="list" className="contents">
          {BUILT_FOR.map((kind) => (
            <li key={kind}>
              <Chip
                tone="neutral"
                size="lg"
                className="max-sm:px-3 max-sm:py-2 max-sm:type-label max-sm:leading-5 xl:px-3.5 xl:type-body-s"
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
