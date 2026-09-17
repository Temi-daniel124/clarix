import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = { title: "Help" };

/**
 * Help / Support (super-admin blueprint 9.3).
 *
 * Deliberately not the FAQ accordion the other three roles get. The blueprint is clear about who
 * holds this role: "the platform's own operator, not an end user needing hand-holding", so this
 * is "less a support desk and more a quick-reference and escalation point": three reference
 * notes on the things that are genuinely easy to get wrong, and an address for everything else.
 *
 * It exists mainly so the pattern is complete and can be handed to somebody else later without a
 * gap, which is also why each note says what actually happens rather than what ought to.
 */

const NOTES = [
  {
    title: "How the deduction policy affects every cooperative",
    body: "The basis and the percentage on the Policy screen are what every eligibility figure in Clarix is computed from. Changing either recalculates what every member at every cooperative is told they can borrow, the moment it saves, which is why that change asks before it commits and records the old value beside the new one. Loans already approved are unaffected; what anybody can borrow next is not.",
  },
  {
    title: "How access requests work, and why they are time-boxed",
    body: "This account has no standing sight of any member's savings, loans or salary. When a support case genuinely needs it, the way in is an access request naming the cooperative and the reason, which that cooperative's admin is told about, which expires on its own, and under which every record viewed is logged individually. That flow is not built yet, so today there is no path at all from this account to a member's records.",
  },
  {
    title: "How to deactivate a cooperative safely",
    body: "Deactivating keeps every record the cooperative holds and stops it appearing to employees looking for somewhere to join. It does not cancel loans, delete savings, or remove anybody's membership. The action waits several seconds before committing so it can be undone, and reactivating restores visibility. Nothing about it is destructive, which is why it is not treated as though it were.",
  },
  {
    title: "What this account cannot do, on purpose",
    body: "It cannot open a member's profile, read a cooperative's own audit log, edit a cooperative's loan products, or approve a loan. Those belong to the cooperative that holds the relationship. If a screen here looks like it is missing one of them, it is not missing.",
  },
];

export default function PlatformHelpPage() {
  return (
    <div className="mx-auto w-full max-w-[680px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Help</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Reference notes on the four things worth being sure about before you touch them.
      </p>

      <div className="mt-10 flex flex-col gap-px overflow-hidden rounded-feature border border-border bg-border">
        {NOTES.map((note) => (
          <section key={note.title} className="bg-surface px-5 py-5 md:px-6">
            <h2 className="type-card-title text-text">{note.title}</h2>
            <p className="type-secondary mt-2 max-w-[560px] text-text-secondary">{note.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="type-card-title text-text">Anything else</h2>
        <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
          There is no support queue behind this role, because at this stage the person operating
          the platform is the person who built it. Write to the same address everyone else does.
        </p>

        <Link
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-4 inline-flex items-center gap-2 type-secondary font-medium text-indigo underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
        >
          {SUPPORT_EMAIL}
          <ArrowRight aria-hidden strokeWidth={2} className="size-4" />
        </Link>
      </section>
    </div>
  );
}
