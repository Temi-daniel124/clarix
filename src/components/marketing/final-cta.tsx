import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/support";
import { cn } from "@/lib/utils";
import { FINAL_CTA } from "./copy";
import { LEAD } from "./section";

/**
 * The final call to action (spec §11.1 item 10; round-2 board): a white ring-pattern card on
 * porcelain with this part of the page's one primary, and the walkthrough as its secondary.
 */
const WALKTHROUGH_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "Clarix walkthrough",
)}`;

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="reveal mx-auto w-full max-w-[1240px] px-5 pb-14 md:px-6 lg:pb-[72px]"
    >
      <div className="ring-pattern flex flex-wrap items-center justify-between gap-8 rounded-[32px] lg:flex-nowrap bg-white p-6 shadow-flat sm:p-10 lg:p-14">
        <div className="min-w-0 max-w-[620px]">
          <h2
            id="final-cta-heading"
            className="type-page-title mb-2.5 text-balance text-indigo-night lg:text-[40px] lg:leading-[1.02] lg:tracking-[-0.045em]"
          >
            {FINAL_CTA.heading}
          </h2>
          <p className={LEAD}>{FINAL_CTA.body}</p>
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-3 sm:w-auto">
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "max-sm:w-full lg:h-12 lg:px-[26px]")}
          >
            {FINAL_CTA.primary}
          </Link>
          <a
            href={WALKTHROUGH_HREF}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "text-indigo-night max-sm:w-full lg:h-12 lg:px-6",
            )}
          >
            {FINAL_CTA.secondary}
          </a>
        </div>
      </div>
    </section>
  );
}
