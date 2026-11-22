import type { Metadata } from "next";
import { BILLING_FAQ_HEADING, BILLING_FAQ_ITEMS, PRICING_PAGE } from "@/components/marketing/copy";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { BillingTerms, PricingIntro } from "@/components/marketing/pricing-page";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { pageMetadata } from "@/lib/site";

/**
 * Pricing (spec §11.1; D037): the estimator, the billing terms, the billing questions and the
 * final card. The final card holds the page's one primary; the nav's and the estimator's calls
 * to action are secondary.
 */
const title = PRICING_PAGE.metaTitle;
const description = PRICING_PAGE.metaDescription;

export const metadata: Metadata = {
  title,
  description,
  ...pageMetadata("/pricing", { title, description }),
};

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <PricingIntro />
        <BillingTerms />
        <Faq items={BILLING_FAQ_ITEMS} heading={BILLING_FAQ_HEADING} />
        <FinalCta />
      </main>
      <SiteFooter credits={[]} />
    </>
  );
}
