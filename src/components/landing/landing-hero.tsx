import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EligibilityPreview } from "@/components/clarix/eligibility-preview";
import { HeroBackdrop } from "./hero-backdrop";

/**
 * Landing hero (employee blueprint 1.1), built on the Watermelon hero-32 structure.
 *
 * Kept from it: the staggered entrance choreography. Nav drops in first, the title rises with
 * more weight behind it, the subtitle follows lighter and quicker, the call to action scales
 * into place last. The timings below are the original's stagger, re-expressed as CSS delays
 * against the one Clarix spring (see globals.css).
 *
 * Replaced entirely: the sunflower photograph, the "Haven / Seamless AI Solutions" copy, the
 * serif display face, the sky-blue palette, the white glass buttons, and the play-button CTA
 * that pointed at a video that does not exist. hero-32 also ships no carousel, which suits,
 * this is one composed static background, built from the product's own motif.
 *
 * The hero's visual is the real eligibility check running, not an illustration of one, which is
 * DESIGN_SYSTEM.md's instruction and the most persuasive thing the page can show.
 */
export function LandingHero() {
  return (
    <div className="surface-navy relative isolate bg-navy-surface">
      <HeroBackdrop />

      <div className="relative z-10">
        <div className="mx-auto w-full max-w-[1160px] px-5 pt-28 pb-16 md:px-8 md:pt-36 md:pb-24">
          <div className="mx-auto max-w-[780px] text-center">
            <h1
              className="enter-title type-display text-white"
              style={{ animationDelay: "120ms" }}
            >
              One employee. Several cooperatives. One salary.
            </h1>

            <p
              className="enter-rise mx-auto mt-6 max-w-[620px] type-body text-white/65"
              style={{ animationDelay: "260ms" }}
            >
              Cooperatives at Federal Medical Centre, Abeokuta each approve loans without seeing
              what a member already owes elsewhere. Clarix coordinates those deductions, so the
              combined total is checked against the agreed limit before anyone commits.
            </p>
          </div>

          <div
            className="enter-rise mx-auto mt-12 max-w-[560px]"
            style={{ animationDelay: "380ms" }}
          >
            <EligibilityPreview pace="hero" />
          </div>

          <div
            className="enter-scale mt-10 flex flex-col items-center gap-4"
            style={{ animationDelay: "500ms" }}
          >
            <Button render={<Link href="/signup" />} className="w-full sm:w-auto">
              Get started
              <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
            </Button>
            <p className="type-caption text-white/45">
              Free for FMC Abeokuta staff during the pilot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
