"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Bell, KeyRound, UserPen, type LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PersonalInfoForm } from "@/app/(app)/profile/personal-info-form";
import { PreferencesForm } from "@/app/(app)/profile/preferences-form";
import { SecurityForm } from "@/app/(app)/profile/security-form";
import type { NotificationCategory } from "@/lib/notifications";

/**
 * The admin's own Profile / Settings — admin blueprint 8.2.
 *
 * Deliberately the same three sections as the employee's, through the same three components and
 * the same server actions: personal information, security, notification preferences. This is one
 * account model, not two — the person editing here may well be an ordinary member somewhere else,
 * and their name and password are the same name and password either way.
 *
 * What is absent is the salary section, and its absence is the point: "being an Admin doesn't
 * require or imply being a beneficiary member anywhere". An admin with no membership has no
 * salary on file and no deduction limit, and a section explaining that would be a section about
 * nothing.
 */
export function AdminProfileSections({
  name,
  email,
  phone,
  preferences,
  memberCooperativeCount,
}: {
  name: string | null;
  email: string | null;
  phone: string | null;
  preferences: Record<NotificationCategory, boolean>;
  /** How many cooperatives this account belongs to as an ordinary member. */
  memberCooperativeCount: number;
}) {
  return (
    <>
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

      {memberCooperativeCount > 0 ? (
        <div className="mt-8 rounded-feature border border-border bg-surface p-5 md:p-6">
          <h2 className="type-card-title text-text">You are also a member</h2>
          <p className="type-secondary mt-2 max-w-[520px] text-text-secondary">
            This account belongs to{" "}
            {memberCooperativeCount === 1
              ? "a cooperative"
              : `${memberCooperativeCount} cooperatives`}{" "}
            as an ordinary member, separately from the one you manage. Your savings, loans and
            deduction limit live on that side, and nothing you do here touches them.
          </p>

          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 type-secondary font-medium text-indigo underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
          >
            Switch to my member view
            <ArrowRight aria-hidden strokeWidth={2} className="size-4" />
          </Link>
        </div>
      ) : null}
    </>
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
            <span className="block truncate type-card-title text-text transition-colors duration-150 group-hover/accordion-trigger:text-emerald">
              {title}
            </span>
            <span className="mt-0.5 block type-caption font-normal text-text-muted">{summary}</span>
          </span>
        </span>
      </AccordionTrigger>

      <AccordionContent className="pb-6">{children}</AccordionContent>
    </AccordionItem>
  );
}
