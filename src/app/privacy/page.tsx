import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/clarix/wordmark";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How Clarix collects, uses and protects salary information, staff ID numbers and payslip documents under the Nigeria Data Protection Act 2023.",
};

/**
 * Privacy notice, linked from the consent checkbox on sign-up.
 *
 * **Written against what this system actually does, and nothing else.** Every claim below is
 * checkable in the schema: the tables named exist, the isolation described is the RLS in
 * `supabase/migrations`, the aggregate-only cross-cooperative figure is `capacity_for_user()`, and
 * the logged access-grant exception is `access_grants` (DECISIONS.md D030). Where Clarix does not
 * yet do something, automatic deletion on a schedule, for instance. This says so plainly rather
 * than describing a policy nobody has implemented. A privacy notice that overstates its own
 * controls is worse than one that admits a gap, because the first is a promise the code does not
 * keep.
 *
 * The lawful basis is consent, given at sign-up, which is what the checkbox on that screen records.
 */

const UPDATED = "13 September 2026";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[760px] items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" aria-label="Clarix home">
          <Wordmark />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-24 md:px-8">
        <h1 className="type-page-title text-text">Privacy notice</h1>
        <p className="type-caption mt-2 text-text-muted">Last updated {UPDATED}</p>

        <p className="type-body mt-6 max-w-[620px] text-text-secondary">
          This notice explains what Clarix collects about you, why, who can see it, and what you
          can ask us to do about it. It is written for the Nigeria Data Protection Act 2023 (NDPA)
          and describes the system as it actually works today.
        </p>

        <Section title="Who is responsible for your data">
          <p>
            Clarix is operated for the staff cooperatives of Federal Medical Centre, Abeokuta. The
            operator of the Clarix platform is the data controller for the account information
            described below. Each cooperative you join is a separate controller of the membership,
            savings and loan records it holds about you.
          </p>
          <p>
            You can reach us about anything in this notice at{" "}
            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-indigo underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </Link>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <p>We collect only what the service needs in order to work:</p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong className="text-text">Account details.</strong> Your email address, your
              name, and optionally a phone number. Your password is held by our authentication
              provider, Supabase, and is never visible to Clarix or to any cooperative.
            </li>
            <li>
              <strong className="text-text">Your staff identification number</strong> (your IPPIS
              number), which is how a cooperative recognises you as the person on its member list.
            </li>
            <li>
              <strong className="text-text">Salary information.</strong> Your gross and net monthly
              pay, taken from a payslip you upload, and the date it was confirmed.
            </li>
            <li>
              <strong className="text-text">Payslip documents</strong> that you upload as evidence
              of that salary.
            </li>
            <li>
              <strong className="text-text">Cooperative records.</strong> Which cooperatives you
              belong to, your savings balance and the entries behind it, and your loan applications
              and repayments.
            </li>
          </ul>
          <p>
            Your salary figures, your staff identification number and your payslip documents are{" "}
            <strong className="text-text">sensitive personal data</strong> under the NDPA, and are
            treated as such throughout.
          </p>
        </Section>

        <Section title="Why we collect it, and on what basis">
          <p>
            Our lawful basis is your <strong className="text-text">consent</strong>, which you give
            when you create an account by ticking the box confirming you accept how your data is
            used. You can withdraw that consent at any time by asking us to close your account.
          </p>
          <p>
            The purpose is a single one. Salary deductions at Federal Medical Centre, Abeokuta are
            capped at a percentage of pay, and that cap applies to everything you owe across every
            cooperative at once. No individual cooperative can see what you owe elsewhere, so none
            of them can tell whether a new loan would push you past the limit. Clarix works that
            figure out in one place so a loan is approved against what is actually left.
          </p>
        </Section>

        <Section title="Who can see what">
          <p>This is the part worth reading carefully, because the boundaries are deliberate.</p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong className="text-text">Each cooperative sees only its own records.</strong> A
              cooperative you belong to can see your name, your staff identification number, the
              savings and loans you hold <em>with them</em>, and the eligibility figure described
              below. It cannot see your records at any other cooperative. This is enforced in the
              database itself rather than by the screens.
            </li>
            <li>
              <strong className="text-text">
                The cross-cooperative check shows a total, never a source.
              </strong>{" "}
              When a cooperative checks whether you can take a loan, Clarix tells them your
              deduction limit, the total you already owe monthly across all your cooperatives, and
              what is left. It never tells them which cooperatives those obligations are with, how
              many there are, or anything held at any of them.
            </li>
            <li>
              <strong className="text-text">Your payslip document.</strong> The file you upload is
              stored privately and is normally readable by you alone. There is one exception:
              while you have a loan application waiting for a decision at a cooperative, the people
              there who decide it can open the payslip your salary figure came from, so they can
              check that figure against its evidence before lending against it. That access ends
              the moment your application is decided or lapses. Nobody else can open it at any
              time, and nobody can change it.
            </li>
            <li>
              <strong className="text-text">
                The platform operator has no standing access to your money.
              </strong>{" "}
              Whoever runs Clarix cannot see any member&rsquo;s savings, loans or salary by
              default. If a support case genuinely requires it, they must record a written reason,
              your cooperative&rsquo;s administrator is notified before the access begins, it lasts
              at most 24 hours, it is read-only, and every record opened is written into your
              cooperative&rsquo;s own audit log where its administrator can see it.
            </li>
            <li>
              <strong className="text-text">Other members never see your records.</strong> There is
              no screen anywhere in Clarix where one member can look up another.
            </li>
          </ul>
        </Section>

        <Section title="Who else processes your data">
          <p>
            We use a small number of service providers, and none of them is sent your data for
            their own purposes:
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong className="text-text">Supabase</strong> hosts the database, the
              authentication system and the private storage your payslip is kept in. Data is stored
              in the European Union (Ireland).
            </li>
            <li>
              <strong className="text-text">Vercel</strong> hosts and serves the application.
            </li>
            <li>
              <strong className="text-text">Resend</strong> delivers email, such as a sign-in
              confirmation or a password reset link. Messages you send from the Help screen carry
              your name and email address and nothing else; your staff identification number,
              salary and documents are never included.
            </li>
          </ul>
          <p>
            Because our database is hosted in Ireland, your data is transferred outside Nigeria.
            That transfer is covered by the consent described above and by the contractual terms of
            those providers.
          </p>
          <p>
            We do not sell your data, we do not share it for advertising, and we do not use it to
            train any model.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your account, membership, savings and loan records for as long as your account
            exists, because they are the record of money you and your cooperative both rely on.
            Your payslip document is kept while your confirmed salary is based on it, so a
            cooperative can check a decision against its evidence.
          </p>
          <p>
            We should be straightforward about the current state of this: Clarix does not yet
            delete anything automatically on a schedule. Deletion happens when you ask for it. If
            you ask us to close your account, we remove your account and the documents attached to
            it. Your cooperative may need to retain a record of loans and repayments for its own
            accounting and legal obligations, which is its decision as a separate controller, not
            ours.
          </p>
        </Section>

        <Section title="Your rights">
          <p>Under the NDPA you have the right to:</p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
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
            Much of this you can do yourself: your name and contact details are editable on your
            Profile screen, and your savings, loans and deductions are visible to you there in
            full. For anything else, write to{" "}
            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-indigo underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </Link>
            .
          </p>
        </Section>

        <Section title="How we protect it">
          <p>
            Access rules are enforced in the database rather than by the screens, which means a
            boundary cannot be stepped around by guessing at a web address. Payslips are held in
            private storage that is readable only through those same rules. Connections are
            encrypted. Cooperative staff actions that touch a member&rsquo;s money are recorded in
            an audit log that nobody, including the cooperative&rsquo;s own administrator, can edit
            or delete.
          </p>
        </Section>

        <Section title="Changes to this notice">
          <p>
            If we change how any of this works, we will update this page and change the date at the
            top. Where a change materially affects how your data is used, we will tell you rather
            than rely on you noticing.
          </p>
        </Section>

        <div className="mt-12 border-t border-border pt-8">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 type-secondary font-medium text-indigo underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
          >
            <ArrowLeft aria-hidden strokeWidth={2} className="size-4" />
            Back to creating your account
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="type-section text-text">{title}</h2>
      <div className="mt-3 flex max-w-[620px] flex-col gap-3 type-body text-text-secondary">
        {children}
      </div>
    </section>
  );
}
