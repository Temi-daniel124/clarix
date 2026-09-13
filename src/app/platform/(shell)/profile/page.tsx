import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IdentityMark } from "@/components/clarix/identity-mark";
import { PersonalInfoForm } from "@/app/(app)/profile/personal-info-form";
import { PreferencesForm } from "@/app/(app)/profile/preferences-form";
import { SecurityForm } from "@/app/(app)/profile/security-form";
import { LogOutButton } from "@/app/(app)/profile/log-out-button";
import { createClient } from "@/lib/supabase/server";
import {
  NOTIFICATION_CATEGORY_ORDER,
  categoryEnabled,
  type NotificationCategory,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile" };

/**
 * Profile / Settings — super-admin blueprint 9.2, reached from Part 3's navigation.
 *
 * Built here, ahead of its own part, for one reason: Part 3 puts Profile in this role's sidebar,
 * and a row that leads nowhere is worse than one assembled from pieces that already exist. It is
 * the same three sections, the same three components and the same server actions every other
 * role's Profile uses — there is nothing role-specific about changing your own name or password.
 *
 * What is absent is any cooperative context, because this account holds none. That is the role,
 * not a gap.
 */
export default async function PlatformProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, phone, notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  const preferences = Object.fromEntries(
    NOTIFICATION_CATEGORY_ORDER.map((category) => [
      category,
      categoryEnabled(profile?.notification_preferences, category),
    ]),
  ) as Record<NotificationCategory, boolean>;

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <header className="flex items-center gap-4">
        <IdentityMark name={profile?.name ?? null} className="size-14 shrink-0" />

        <div className="min-w-0">
          <h1 className="type-page-title truncate text-text">{profile?.name ?? "Your account"}</h1>
          <p className="type-secondary mt-1 truncate text-text-secondary">
            Platform administration
          </p>
        </div>
      </header>

      <Accordion defaultValue={["personal"]} multiple={false} className="mt-8 gap-4">
        <Section
          value="personal"
          title="Personal information"
          summary="Your name and how Clarix reaches you"
        >
          <PersonalInfoForm
            name={profile?.name ?? null}
            email={profile?.email ?? user.email ?? null}
            phone={profile?.phone ?? null}
          />
        </Section>

        <Section value="security" title="Security" summary="Change the password you sign in with">
          <SecurityForm />
        </Section>

        <Section
          value="notifications"
          title="Notification preferences"
          summary="What Clarix emails you about"
        >
          <PreferencesForm preferences={preferences} />
        </Section>
      </Accordion>

      <div className="mt-12 border-t border-border pt-6">
        <LogOutButton />
      </div>
    </div>
  );
}

function Section({
  value,
  title,
  summary,
  children,
}: {
  value: string;
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
        <span className="min-w-0">
          <span className="block truncate type-card-title text-text transition-colors duration-150 group-hover/accordion-trigger:text-emerald">
            {title}
          </span>
          <span className="mt-0.5 block type-caption font-normal text-text-muted">{summary}</span>
        </span>
      </AccordionTrigger>

      <AccordionContent className="pb-6">{children}</AccordionContent>
    </AccordionItem>
  );
}
