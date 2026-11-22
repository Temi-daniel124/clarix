import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { EYEBROW, LEAD } from "@/components/marketing/section";
import { pageMetadata } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/support";
import { cn } from "@/lib/utils";

const title = "Privacy notice";
const description =
  "How Clarix collects, uses and protects your account details, your cooperative records and the income evidence behind your limit, under the Nigeria Data Protection Act 2023.";

export const metadata: Metadata = {
  title,
  description,
  ...pageMetadata("/privacy", { title, description }),
};

/**
 * Privacy notice, linked from the consent checkbox on sign-up.
 *
 * **Written against what this system does, and nothing else.** The isolation described is the
 * RLS in `supabase/migrations`, the aggregate-only cross-cooperative figure is
 * `capacity_for_user()`, the reviewer's window onto income evidence is D031, and the logged
 * access-grant exception is `access_grants` (D030). Since D032 and D038, Clarix serves any kind of
 * cooperative and a member's limit may come from a payslip, bank statements or a figure an officer
 * confirms, so the notice describes all three. Where Clarix does not yet do something, automatic
 * deletion on a schedule, for instance, it says so plainly rather than describing a policy nobody
 * has implemented. A privacy notice that overstates its own controls is worse than one that admits
 * a gap, because the first is a promise the code does not keep.
 *
 * The lawful basis is consent, given at sign-up, which is what the checkbox on that screen records.
 *
 * Its one action is a tertiary link back to sign-up: a notice has no primary.
 */

const UPDATED = "22 November 2026";

const SECTIONS = [
  { id: "responsible", title: "Who is responsible for your data" },
  { id: "collect", title: "What we collect" },
  { id: "why", title: "Why we collect it, and on what basis" },
  { id: "who-sees", title: "Who can see what" },
  { id: "processors", title: "Who else processes your data" },
  { id: "retention", title: "How long we keep it" },
  { id: "rights", title: "Your rights" },
  { id: "protection", title: "How we protect it" },
  { id: "changes", title: "Changes to this notice" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2";

const inlineLink = cn(
  "rounded-[4px] font-semibold text-indigo-600 underline decoration-indigo-600/40 underline-offset-2 transition-colors duration-150 hover:decoration-current",
  focusRing,
);

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

function MailLink() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className={inlineLink}>
      {SUPPORT_EMAIL}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-5 pt-10 pb-[72px] md:px-6 md:pt-14 lg:pb-24">
        <header className="flex max-w-[760px] flex-col gap-4">
          <p className={EYEBROW}>NDPA 2023</p>
          <h1 className="type-page-title text-balance text-indigo-night">Privacy notice</h1>
          <p className="text-[14px] text-muted">Last updated {UPDATED}</p>
          <p className={cn(LEAD, "max-w-[640px]")}>
            This notice explains what Clarix collects about you, why, who can see it, and what you
            can ask us to do about it. It is written for the Nigeria Data Protection Act 2023
            (NDPA) and describes the system as it actually works today.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12">
          <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-32">
              <p className="mb-2 text-[13px] font-semibold text-ink-2">On this page</p>
              <ol className="flex flex-col">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={cn(
                        "flex min-h-11 items-center rounded-tag py-1 text-[14.5px] leading-[1.35] text-ink-2 transition-colors duration-150 hover:text-indigo-night",
                        focusRing,
                      )}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="divide-y divide-line rounded-feature bg-white shadow-flat lg:col-span-9">
            <Section id="responsible">
              <p>
                Clarix is a platform that cooperatives use to keep their savings, loan and
                repayment records, and to check a loan against what a member already owes in every
                cooperative they belong to. The operator of the Clarix platform is the data
                controller for the account information described below. Each cooperative you join
                is a separate controller of the membership, savings and loan records it holds about
                you.
              </p>
              <p>
                You can reach us about anything in this notice at <MailLink />.
              </p>
            </Section>

            <Section id="collect">
              <p>We collect only what the service needs in order to work:</p>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>
                  <Strong>Account details.</Strong> Your email address, your name, and optionally a
                  phone number. Your password is held by our authentication provider, Supabase, and
                  is never visible to Clarix or to any cooperative.
                </li>
                <li>
                  <Strong>Membership details.</Strong> The member number a cooperative knows you by
                  and, only if you are salaried and repay by salary deduction, the staff ID your
                  employer gave you, so a cooperative can recognise you on its member list.
                </li>
                <li>
                  <Strong>Your income figure.</Strong> The monthly figure your limit is worked out
                  from, and the date it was confirmed. If you are salaried, that is your gross and
                  net pay, read from a payslip. If you are not, it is your average monthly money
                  coming in, read from three to six months of bank statements. You may instead give
                  a figure yourself, which stays marked unverified until an officer at your
                  cooperative confirms it.
                </li>
                <li>
                  <Strong>Income evidence.</Strong> The payslips or bank statements you upload to
                  support that figure.
                </li>
                <li>
                  <Strong>Cooperative records.</Strong> Which cooperatives you belong to, your
                  savings balance and the entries behind it, your loan applications and repayments,
                  and the receipts you attach when you record a repayment.
                </li>
              </ul>
              <p>
                Your income figure, your income evidence and any staff ID are{" "}
                <Strong>sensitive personal data</Strong> under the NDPA, and are treated as such
                throughout.
              </p>
            </Section>

            <Section id="why">
              <p>
                Our lawful basis is your <Strong>consent</Strong>, which you give when you create an
                account by ticking the box confirming you accept how your data is used. You can
                withdraw that consent at any time by asking us to close your account.
              </p>
              <p>We use your data for two purposes, and only these.</p>
              <p>
                The first is keeping your cooperative&rsquo;s records: your savings, loans,
                repayments and statements, which you and your cooperative both rely on.
              </p>
              <p>
                The second is the cross-cooperative check. Everything you repay each month, in
                every cooperative you belong to, comes out of one income, and the limit on how much
                of that income can go to repayments applies to all of it at once. No single
                cooperative can see what you owe elsewhere, so none of them can tell on its own
                whether a new loan would take you past your limit. Clarix works that figure out in
                one place, so a loan is approved against what is actually left.
              </p>
            </Section>

            <Section id="who-sees">
              <p>This is the part worth reading carefully, because the boundaries are deliberate.</p>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>
                  <Strong>Each cooperative sees only its own records.</Strong> A cooperative you
                  belong to can see your name, your membership details, the savings and loans you
                  hold <em>with them</em>, and the figure described below. It cannot see your
                  records at any other cooperative. This is enforced in the database itself rather
                  than by the screens.
                </li>
                <li>
                  <Strong>The cross-cooperative check shows a total, never a source.</Strong> When a
                  cooperative checks whether you can take a loan, Clarix tells them your limit, the
                  combined total you already repay each month across all your cooperatives, and
                  what is left. Other cooperatives never see your records: not which cooperatives
                  those repayments are with, how many there are, or anything held at any of them. A
                  cooperative that signed itself up takes no part in this check until Clarix has
                  verified it is a real cooperative.
                </li>
                <li>
                  <Strong>Your income evidence.</Strong> The payslips and bank statements you upload
                  are stored privately and are normally readable by you alone. There is one
                  exception: while you have a loan application waiting for a decision at a
                  cooperative, the officer there who is reviewing it can open the evidence your
                  income figure came from, so they can check the figure before lending against it.
                  That access ends the moment your application is decided or lapses. Nobody else can
                  open it at any time, no other cooperative ever can, and nobody can change it.
                </li>
                <li>
                  <Strong>The platform operator has no standing access to your money.</Strong>{" "}
                  Whoever runs Clarix cannot see any member&rsquo;s savings, loans or income by
                  default. If a support case genuinely requires it, they must record a written
                  reason, your cooperative&rsquo;s administrator is notified before the access
                  begins, it lasts at most 24 hours, it is read-only, and every record opened is
                  written into your cooperative&rsquo;s own audit log where its administrator can
                  see it.
                </li>
                <li>
                  <Strong>Other members never see your records.</Strong> There is no screen anywhere
                  in Clarix where one member can look up another.
                </li>
              </ul>
            </Section>

            <Section id="processors">
              <p>
                We use a small number of service providers, and none of them is sent your data for
                their own purposes:
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>
                  <Strong>Supabase</Strong> hosts the database, the authentication system and the
                  private storage your income evidence and receipts are kept in. Data is stored in
                  the European Union (Ireland).
                </li>
                <li>
                  <Strong>Vercel</Strong> hosts and serves the application.
                </li>
                <li>
                  <Strong>Resend</Strong> delivers email, such as a sign-in confirmation or a
                  password reset link. Messages you send from the Help screen carry your name and
                  email address and nothing else; your income, your documents and any staff ID are
                  never included.
                </li>
              </ul>
              <p>
                Because our database is hosted in Ireland, your data is transferred outside Nigeria.
                That transfer is covered by the consent described above and by the contractual
                terms of those providers.
              </p>
              <p>
                We do not sell your data, we do not share it for advertising, and we do not use it
                to train any model.
              </p>
            </Section>

            <Section id="retention">
              <p>
                We keep your account, membership, savings and loan records for as long as your
                account exists, because they are the record of money you and your cooperative both
                rely on. Your income evidence is kept while your confirmed income figure is based on
                it, so a cooperative can check a decision against its evidence.
              </p>
              <p>
                We should be straightforward about the current state of this: Clarix does not yet
                delete anything automatically on a schedule. Deletion happens when you ask for it.
                If you ask us to close your account, we remove your account and the documents
                attached to it. Your cooperative may need to retain a record of loans and repayments
                for its own accounting and legal obligations, which is its decision as a separate
                controller, not ours.
              </p>
            </Section>

            <Section id="rights">
              <p>Under the NDPA you have the right to:</p>
              <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted">
                <li>ask what we hold about you and receive a copy;</li>
                <li>have anything inaccurate corrected;</li>
                <li>ask us to delete your data and close your account;</li>
                <li>withdraw your consent, which has the same effect as asking us to close it;</li>
                <li>object to how we use your data, or ask us to restrict it;</li>
                <li>
                  complain to the Nigeria Data Protection Commission if you think we have got this
                  wrong.
                </li>
              </ul>
              <p>
                Much of this you can do yourself: your name and contact details are editable on
                your Profile screen, and your savings, loans and repayments are visible to you there
                in full. For anything else, write to <MailLink />.
              </p>
            </Section>

            <Section id="protection">
              <p>
                Access rules are enforced in the database rather than by the screens, which means a
                boundary cannot be stepped around by guessing at a web address. Income evidence and
                receipts are held in private storage that is readable only through those same
                rules. Connections are encrypted. Cooperative staff actions that touch a
                member&rsquo;s money are recorded in an audit log that nobody, including the
                cooperative&rsquo;s own administrator, can edit or delete.
              </p>
            </Section>

            <Section id="changes">
              <p>
                If we change how any of this works, we will update this page and change the date at
                the top. Where a change materially affects how your data is used, we will tell you
                rather than rely on you noticing.
              </p>
            </Section>
          </article>
        </div>

        <div className="mt-8 lg:ml-[25%] lg:pl-10">
          <Link
            href="/signup"
            className={cn(
              "-ml-1 inline-flex min-h-11 items-center gap-2 rounded-tag px-1 text-[15px] font-semibold text-indigo-600 underline-offset-4 transition-colors duration-150 hover:underline",
              focusRing,
            )}
          >
            <ArrowLeft aria-hidden strokeWidth={2} className="size-4" />
            Back to creating your account
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const heading = SECTIONS.find((entry) => entry.id === id)?.title;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-28 px-5 py-8 sm:px-8 lg:px-10 lg:py-10"
    >
      <h2
        id={`${id}-heading`}
        className="type-section text-balance text-indigo-night"
      >
        {heading}
      </h2>
      <div className="mt-4 flex max-w-[680px] flex-col gap-3 text-[16px] leading-[1.6] text-ink-2">
        {children}
      </div>
    </section>
  );
}
