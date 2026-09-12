import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ContactForm } from "@/app/(app)/help/contact-form";
import { SUPPORT_EMAIL } from "@/lib/support";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Help" };

/**
 * Help / Support — admin blueprint 8.4, officer blueprint 8.3.
 *
 * Same pattern, same contact form, same address — different questions, because the two roles do
 * not have the same ones. The officer blueprint names its categories outright ("Finding and
 * helping members", "Submitting and checking loan applications") and asks for something "sized
 * for a lean pilot rather than a full support desk", so an officer gets ten answers rather than
 * the admin's fifteen, and none of them is about a screen they cannot open.
 *
 * "Structurally identical to the Employee role's Help/Support screen", with the categories the
 * blueprint names for this role and the same contact form component beneath — one support path,
 * one address (DECISIONS.md D026, still provisional until the domain question is settled).
 *
 * Every answer describes what an admin can actually do in Clarix today. Where the honest answer
 * is that something is not built, it says so: an admin who goes looking for a feature and cannot
 * find it is better served by being told than by being left to wonder.
 */

type Faq = { question: string; answer: string };

const MEMBERS: Faq[] = [
  {
    question: "Why do some members show as “not on Clarix yet”?",
    answer:
      "Because you imported them and they have not signed up. Your roster is what your cooperative knows; a Clarix account is what that person creates. The moment they sign up and enter the staff ID you imported, their membership and the savings balance you recorded appear on their side automatically — you do not have to do anything.",
  },
  {
    question: "How do I add one member without running the whole import again?",
    answer:
      "Members, then Add member. Three fields: name, staff ID, and an opening balance if they are transferring in with savings already standing. It writes the same kind of record the import does.",
  },
  {
    question: "What does recording a contribution actually do?",
    answer:
      "It writes an entry in that member's ledger and moves their balance to match. Clarix holds no money and transfers none — you are recording what payroll has already delivered, in a book the member can also see.",
  },
  {
    question: "Can I correct a figure I entered wrongly?",
    answer:
      "Not yet from the screen. Balances are recomputed from the entries behind them, so a correction means the entry itself has to change, and the screen for that is not built. Until it is, record the correction as a further entry so the ledger still explains the balance.",
  },
];

const LOANS: Faq[] = [
  {
    question: "What does “available capacity” mean on an application?",
    answer:
      "FMC Abeokuta caps total salary deductions at 33.3% of gross pay. Clarix works that figure out from the member's confirmed payslip, subtracts every monthly repayment they already owe across all their cooperatives, and shows you what is left. The member sees the same number on their own screen.",
  },
  {
    question: "Which other cooperatives does that figure include?",
    answer:
      "All of them, and Clarix will never tell you which. You see one combined total, because that is what you need to lend responsibly and it is all the member agreed to share. No cooperative sees another's records, including yours.",
  },
  {
    question: "Can I approve a loan that exceeds the member's limit?",
    answer:
      "Yes. Clarix informs, it does not gatekeep your cooperative's decisions. The button says “Approve anyway” and asks for a short reason, which is recorded in your audit log against that decision. The reason is required — the database refuses the approval without one.",
  },
  {
    question: "What happens when I reject an application?",
    answer:
      "The hold on that member's capacity is released immediately, so it is free for their other requests straight away, and they are told. Nothing about their savings or other loans changes.",
  },
  {
    question: "An application disappeared before I decided. Why?",
    answer:
      "A reservation holds capacity for a limited window — seven days by default — so that one cooperative cannot freeze a member's salary indefinitely by sitting on a request. Once it lapses, the capacity returns to the member. The queue flags anything close to lapsing in amber before that happens.",
  },
  {
    question: "How do I mark a loan as fully repaid?",
    answer:
      "There is no screen for it yet. Repayments you record add up against the loan and its progress reflects them, but nothing flips it to completed. That is the next piece of loan work.",
  },
];

const SETTINGS: Faq[] = [
  {
    question: "What can an officer do?",
    answer:
      "Exactly what you switch on for them, and nothing else. Officers, under Manage cooperative, opens each person's permissions: seeing the member list, recording contributions and repayments, and approving or rejecting loans. Nothing is on unless you turn it on, and each switch changes what the database itself permits.",
  },
  {
    question: "I invited an officer and nothing happened.",
    answer:
      "The invitation is recorded and waiting, but Clarix cannot send the email yet — a verified sending domain is still outstanding. Tell them it is there; it becomes a real role the first time they sign in with that address.",
  },
  {
    question: "What is the difference between the title and the permissions?",
    answer:
      "The title is a label. Calling somebody Treasurer changes what members and your own screens call them, and changes nothing about what they are allowed to do.",
  },
  {
    question: "Why does my loan product ask for a savings percentage?",
    answer:
      "It is your own rule: how much of a requested amount a member must already have saved with you. It is checked separately from the salary deduction cap, and the review screen shows both, because an application can satisfy one and fail the other.",
  },
  {
    question: "What is reconciliation for?",
    answer:
      "Recording what payroll actually deducted against what Clarix expected, month by month. A shortfall entered there is a shortfall somebody can act on, rather than one discovered a year later — and it builds the evidence of how much is going missing.",
  },
];

const OFFICER_MEMBERS: Faq[] = [
  {
    question: "Why can I do some things here and not others?",
    answer:
      "Your cooperative's admin decides, per person. Your own Profile screen lists exactly what you are currently able to do; anything not on that list is not available to you here, and it changes the moment they change it. Nothing is hidden from you about your own permissions.",
  },
  {
    question: "Why do some members show as “not on Clarix yet”?",
    answer:
      "Because they were imported and have not signed up. The roster is what the cooperative knows; a Clarix account is what that person creates. When they sign up and enter the staff ID that was imported, their membership and the savings balance already recorded appear on their side automatically.",
  },
  {
    question: "What does recording a contribution actually do?",
    answer:
      "It writes an entry in that member's ledger and moves their balance to match. Clarix holds no money and transfers none — you are recording what payroll has already delivered, in a book the member can also see. Their balance updates the moment you save.",
  },
  {
    question: "Can I correct a figure I entered wrongly?",
    answer:
      "Not from the screen. Balances are recomputed from the entries behind them, so a correction means the entry itself has to change, and the screen for that is not built. Record the correction as a further entry so the ledger still explains the balance, and tell your admin.",
  },
  {
    question: "Where does the capacity figure on a member's profile come from?",
    answer:
      "FMC Abeokuta caps total salary deductions at 33.3% of gross pay. Clarix works that out from the member's confirmed payslip, subtracts every monthly repayment they already owe across all their cooperatives, and shows what is left. You see one combined total and never which other cooperative it came from — the member sees the same number on their own screen.",
  },
];

const OFFICER_LOANS: Faq[] = [
  {
    question: "How do I start an application on a member's behalf?",
    answer:
      "You cannot yet. Starting an application for somebody else is not built — members apply for themselves from their own account, and those applications arrive in the queue here. This is a missing screen rather than a permission you are lacking.",
  },
  {
    question: "Can I approve or reject an application?",
    answer:
      "Only if your admin has granted it, and your Profile screen says whether they have. Without it the queue is still worth opening: you can see what is waiting and what the eligibility answer is, and an admin makes the decision.",
  },
  {
    question: "What does “exceeds capacity” mean on an application?",
    answer:
      "That the monthly repayment being asked for is more than the member has left under the deduction cap, counting what they already owe everywhere. It is information, not a block: Clarix informs and the cooperative decides, so an approval is still possible and asks for a short reason that is recorded.",
  },
  {
    question: "An application vanished before anyone decided it. Why?",
    answer:
      "A reservation holds capacity for a limited window — seven days by default — so one cooperative cannot freeze a member's salary indefinitely by sitting on a request. Once it lapses, the capacity returns to the member. The queue flags anything close to lapsing in amber first.",
  },
  {
    question: "Why can I not see the audit log?",
    answer:
      "It is the admin's record of what staff did, and reading it is theirs alone. Everything you record is written into it exactly as an admin's entries are — the log does not treat your work differently, it is only read by somebody else.",
  },
];

export default async function AdminHelpPage() {
  const staff = await loadStaffContext();
  const isOfficer = preferredRole(staff?.roles ?? [])?.role === "officer";

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Help</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        The questions cooperative staff ask most, answered plainly. If none of these covers it,
        send a message at the bottom.
      </p>

      {isOfficer ? (
        <>
          <FaqSection title="Finding and helping members" items={OFFICER_MEMBERS} />
          <FaqSection title="Submitting and checking loan applications" items={OFFICER_LOANS} />
        </>
      ) : (
        <>
          <FaqSection title="Managing members" items={MEMBERS} />
          <FaqSection title="Loans and eligibility" items={LOANS} />
          <FaqSection title="Cooperative settings" items={SETTINGS} />
        </>
      )}

      <div className="mt-12">
        <ContactForm supportEmail={SUPPORT_EMAIL} />
      </div>
    </div>
  );
}

function FaqSection({ title, items }: { title: string; items: Faq[] }) {
  return (
    <section className="mt-10">
      <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">{title}</h2>

      <Accordion className="mt-2 rounded-feature border border-border bg-surface px-5 md:px-6">
        {items.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent className="max-w-[600px] pr-2">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
