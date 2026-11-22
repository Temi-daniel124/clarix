"use client";

import type { ReactNode } from "react";
import { Bell, KeyRound, UserPen, Wallet, type LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { NotificationCategory } from "@/lib/notifications";
import { PersonalInfoForm } from "./personal-info-form";
import { PreferencesForm } from "./preferences-form";
import { SalaryPanel } from "./salary-panel";
import { SecurityForm } from "./security-form";

/**
 * The four sections of Profile / Settings (blueprint 6.2).
 *
 * The blueprint asks for "a set of clearly labeled sections, each expandable or linking to its
 * own sub-screen rather than one long scrolling form", so each is a card that opens in place.
 * Only one is open at a time: these are unrelated settings, and two open forms with two Save
 * buttons invites saving the wrong one.
 *
 * Personal information starts open because it is the section an employee most often came here
 * for, and a screen of four closed bars gives no sense of what is inside them.
 *
 * This reuses the same accordion primitive as the landing page and Help rather than inventing a
 * second disclosure control; what differs is the shell it sits in, separate cards here, one
 * divided list there, which is a density choice, not a different component.
 */
export function ProfileSections({
  name,
  email,
  phone,
  salary,
  preferences,
}: {
  name: string | null;
  email: string | null;
  phone: string | null;
  salary: {
    gross: number | null;
    net: number | null;
    verifiedAt: string | null;
    sourceFilename: string | null;
  };
  preferences: Record<NotificationCategory, boolean>;
}) {
  return (
    <Accordion defaultValue={["personal"]} multiple={false} className="mt-8 gap-4">
      <Section
        value="personal"
        icon={UserPen}
        title="Personal information"
        summary="Your name and how Clarix reaches you"
      >
        <PersonalInfoForm name={name} email={email} phone={phone} />
      </Section>

      <Section
        value="salary"
        icon={Wallet}
        title="Salary information"
        summary="The confirmed figures your deduction limit is based on"
      >
        <SalaryPanel
          gross={salary.gross}
          net={salary.net}
          verifiedAt={salary.verifiedAt}
          sourceFilename={salary.sourceFilename}
        />
      </Section>

      <Section
        value="security"
        icon={KeyRound}
        title="Security"
        summary="Change the password you sign in with"
      >
        <SecurityForm />
      </Section>

      <Section
        value="notifications"
        icon={Bell}
        title="Notification preferences"
        summary="What Clarix emails you about"
      >
        <PreferencesForm preferences={preferences} />
      </Section>
    </Accordion>
  );
}

function Section({
  value,
  icon: Icon,
  title,
  summary,
  children,
}: {
  value: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="rounded-feature border border-border bg-surface px-5 last:border-b md:px-6"
    >
      <AccordionTrigger className="gap-4 py-5">
        <span className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
          >
            <Icon className="size-[18px]" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block truncate type-card-title text-text transition-colors duration-150 group-hover/accordion-trigger:text-emerald-700">
              {title}
            </span>
            <span className="mt-1 block type-caption font-normal text-text-muted">
              {summary}
            </span>
          </span>
        </span>
      </AccordionTrigger>

      <AccordionContent className="pb-6">{children}</AccordionContent>
    </AccordionItem>
  );
}
