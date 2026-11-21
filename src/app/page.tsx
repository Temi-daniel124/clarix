import Link from "next/link";
import { ArrowRight, Building2, Landmark, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Wordmark } from "@/components/clarix/wordmark";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { StructuredData } from "@/components/marketing/structured-data";

/**
 * Landing Page (employee blueprint 1.1).
 *
 * The only screen in the employee journey where marketing language is appropriate. Its hero
 * visual is a real, running miniature of the eligibility check rather than an illustration,
 * which is both the blueprint's instruction and the strongest argument the page can make.
 *
 * Deliberately absent, per DESIGN_SYSTEM.md § Concrete anti-generic-design checklist: any
 * testimonial (no real consented quotes exist yet), any "trusted by" logo row, any stock
 * photography, any gradient headline treatment.
 */

const SECTIONS = [
  {
    icon: Landmark,
    heading: "What you see",
    body: "Every cooperative you belong to in one place, savings, loans and what is being deducted from your salary each month, added up correctly across all of them.",
  },
  {
    icon: Building2,
    heading: "What your cooperative sees",
    body: "Before approving a loan, your cooperative sees one figure: how much of your agreed deduction limit is already committed, and how much room is genuinely left.",
  },
  {
    icon: ShieldCheck,
    heading: "What stays private",
    body: "No cooperative ever sees another's records. Only the combined monthly total the limit calculation needs crosses between them, never savings balances, never anyone else's loan.",
  },
];

const FAQ = [
  {
    question: "Does Clarix take money from my salary?",
    answer:
      "No. Clarix never holds, moves or deducts money. It records deductions that your cooperatives already arrange through payroll, so that the total can be checked against your limit before another loan is added.",
  },
  {
    question: "Is Clarix connected to IPPIS or the hospital's payroll?",
    answer:
      "No. There is no live payroll connection. Your salary figure comes from a payslip you upload yourself and confirm on screen, and your cooperative obligations come from Clarix's own records.",
  },
  {
    question: "Can one cooperative see what I owe another one?",
    answer:
      "No. A cooperative deciding on your loan sees only the combined monthly amount already committed and the capacity left over. It never sees which cooperative holds what, or any savings balance but its own.",
  },
  {
    question: "Where does the one-third limit come from?",
    answer:
      "Section 5 of the Nigerian Labour Act caps total deductions from wages at one third. Your organization sets the exact percentage and whether it applies to gross or net pay; every cooperative inherits that same setting.",
  },
  {
    question: "How does a cooperative join Clarix?",
    answer:
      "Cooperatives do not sign up themselves. A cooperative is set up during its own onboarding, and its head is invited by email to complete the setup, profile, loan products and an import of the existing member roster from a spreadsheet.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <StructuredData />
      <LandingNav />
      <LandingHero />

      {/* Three short sections: a heading and one sentence each (blueprint 1.1). */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-[1160px] scroll-mt-24 px-5 py-16 md:px-8 md:py-24"
      >
        <h2 className="type-page-title max-w-[520px] text-text">
          A shared limit, made visible to everyone it affects.
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {SECTIONS.map(({ icon: Icon, heading, body }) => (
            <div key={heading} className="border-t border-border pt-6">
              <Icon
                aria-hidden
                strokeWidth={1.75}
                className="size-6 text-emerald"
              />
              <h3 className="type-section mt-4 text-text">{heading}</h3>
              <p className="type-body mt-3 text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For cooperatives: no self-registration, per ROLES-AND-PERMISSIONS.md. */}
      <section
        id="for-cooperatives"
        className="border-y border-border bg-surface"
      >
        <div className="mx-auto w-full max-w-[1160px] scroll-mt-24 px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16">
            <div>
              <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
                For cooperatives
              </p>
              <h2 className="type-page-title mt-3 text-text">
                Approve the loan knowing what is already committed.
              </h2>
            </div>

            <div>
              <p className="type-body text-text-secondary">
                Cooperatives do not register themselves on Clarix. Each one is set up during its
                own onboarding, and its head is invited by email to complete it: the cooperative
                profile members see, its loan products, and an import of the existing member
                roster straight from the spreadsheet it already lives in.
              </p>
              <p className="type-body mt-4 text-text-secondary">
                From then on, every loan decision carries the same capacity figure the member
                sees, and submitting an application holds that capacity so a second cooperative
                cannot approve against the same room in the same week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (blueprint 1.1). */}
      <section
        id="faq"
        className="mx-auto w-full max-w-[760px] scroll-mt-24 px-5 py-16 md:px-8 md:py-24"
      >
        <h2 className="type-page-title text-text">Questions people actually ask</h2>

        <Accordion className="mt-8" multiple={false}>
          {FAQ.map((entry) => (
            <AccordionItem key={entry.question} value={entry.question}>
              <AccordionTrigger>{entry.question}</AccordionTrigger>
              <AccordionContent>{entry.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer, repeating the single call to action (blueprint 1.1). */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-[1160px] px-5 py-16 md:px-8">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="type-section text-text">Know before you borrow.</h2>
              <p className="type-secondary mt-2 max-w-[420px] text-text-secondary">
                Create your account, confirm your salary from a payslip, and see every
                cooperative you belong to in one place.
              </p>
            </div>

            <Button render={<Link href="/signup" />} className="w-full md:w-auto">
              Get started
              <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
            </Button>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
            <Wordmark />
            <p className="type-caption text-text-muted">
              Built for the staff cooperatives of Federal Medical Centre, Abeokuta.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
