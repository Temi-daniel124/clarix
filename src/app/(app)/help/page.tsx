import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SUPPORT_EMAIL } from "@/lib/support";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Help" };

/**
 * Help / Support (blueprint 6.3).
 *
 * "Sized appropriately for a lean pilot rather than a full support desk": a FAQ under two plain
 * categories, then one way to reach a person. No live chat, no ticket tracking.
 *
 * Every answer below describes what Clarix actually does today: the 33.3% cap FMC Abeokuta
 * configured, what "reserved" means, the fact that Clarix informs rather than approves, what a
 * cooperative can and cannot see. None of it is filler, and none of it promises a feature that
 * is not built. Where the honest answer is "not yet", it says that.
 */

type Faq = { question: string; answer: string };

const SAVINGS_AND_LOANS: Faq[] = [
  {
    question: "How does Clarix work out how much I can borrow?",
    answer:
      "FMC Abeokuta sets one ceiling on how much of your salary may go out in deductions each month: 33.3% of your gross pay. Clarix works out that figure from the salary on the payslip you confirmed, then subtracts every monthly repayment you already owe across all your cooperatives. What is left is what a new loan's monthly repayment can be.",
  },
  {
    question: "Why do loans from my other cooperatives count against my limit?",
    answer:
      "Because they come out of the same salary. A cooperative that can only see its own records has no way of knowing what is already being deducted elsewhere, which is how people end up approved for more than their pay can carry. Clarix adds up the total so that the limit means something.",
  },
  {
    question: "Can other cooperatives see my savings or my loans?",
    answer:
      "No. A cooperative sees its own records with you and one combined figure: what you already owe in total each month. It never sees which cooperative that is with, how much you have saved elsewhere, or any other cooperative's records. That boundary is enforced by the database, not by what the screens choose to show.",
  },
  {
    question: "What does it mean when a loan says “reserved”?",
    answer:
      "You have applied, and the monthly repayment is being held against your limit while the cooperative decides. That keeps a second application from being approved against capacity the first one has already claimed. If the cooperative does not decide before the hold lapses, the capacity is free again.",
  },
  {
    question: "Does Clarix approve my loan?",
    answer:
      "No. Your cooperative decides, exactly as it always has. Clarix tells both of you the same thing about what fits inside your limit, and shows the cooperative the same figures you saw when you applied.",
  },
  {
    question: "Can I still apply when a loan is over my limit?",
    answer:
      "Yes. The screen tells you by how much before you send it, and nothing is held against your capacity, but the application still reaches the cooperative and they see the same shortfall you did. Clarix informs; it does not block you.",
  },
  {
    question: "Where do my savings figures come from?",
    answer:
      "From the cooperative that holds them. Each one records your contributions, and your savings statement for that cooperative lists every entry with the balance as it stood after it, so you can check it against their own books.",
  },
];

const MY_ACCOUNT: Faq[] = [
  {
    question: "Where does my salary figure come from?",
    answer:
      "Only from the payslip you uploaded and confirmed. Clarix has no connection to payroll and never reads your pay from anywhere else, which is why the figures are labelled as coming from that document everywhere they appear.",
  },
  {
    question: "My pay has changed. What do I do?",
    answer:
      "Open Profile, go to Salary information and choose Re-upload payslip. You confirm the new figures the same way you did at sign-up, and every limit in Clarix is worked out again from them straight away.",
  },
  {
    question: "Who can see my payslip?",
    answer:
      "You, and nobody else. It is stored in a private area no other account can reach. An officer at a cooperative you belong to can see the salary figures your limit is based on, because that is what they are assessing, but never the document itself.",
  },
  {
    question: "How do I change my password or my contact details?",
    answer:
      "Both are on the Profile screen. Personal information covers your name, email and phone; Security changes your password, and asks for your current one first so that an unlocked phone is not enough to lock you out of your own account.",
  },
  {
    question: "Can I sign in with my phone number?",
    answer:
      "Not yet. Clarix uses email and password only for now. Sending codes by SMS needs a provider the pilot does not have, so offering it would mean an option that fails at the last step.",
  },
  {
    question: "What are the notification toggles for?",
    answer:
      "They control what Clarix emails you about. Turning one off never hides anything: the notification is still recorded and still appears on your Notifications screen, so nothing about your money goes missing because of a preference.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Help</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        The questions employees ask most, answered plainly. If none of these covers it, send a
        message at the bottom.
      </p>

      <FaqSection title="About my savings and loans" items={SAVINGS_AND_LOANS} />
      <FaqSection title="About my account" items={MY_ACCOUNT} />

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
