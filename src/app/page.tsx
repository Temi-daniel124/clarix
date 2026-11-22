import type { Metadata } from "next";
import { BuiltFor } from "@/components/marketing/built-for";
import { CrossCheck } from "@/components/marketing/cross-check";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { PricingSection } from "@/components/marketing/pricing-estimator";
import { RepaymentSteps } from "@/components/marketing/repayment-steps";
import { Roles } from "@/components/marketing/roles";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { StatementPreview } from "@/components/marketing/statement-preview";
import { StructuredData } from "@/components/marketing/structured-data";
import { pageMetadata, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

/**
 * The landing page (spec §11.1, Home), as drawn on the round-2 landing board.
 *
 * Its one primary is "Start your 60-day free trial" in the hero; the final card repeats it as the
 * only primary at the foot of the page. Everything between is secondary or tertiary. There is no
 * testimonials section, no partner logos and no invented statistic until real, permitted ones
 * exist (spec §1).
 */

// Title and description come from the root layout; the canonical and og block are the home's own.
export const metadata: Metadata = pageMetadata("/", {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
});

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <Hero />
        <BuiltFor />
        <RepaymentSteps />
        <Roles />
        <CrossCheck />
        <StatementPreview />
        <PricingSection />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
