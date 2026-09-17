import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IdentityMark } from "@/components/clarix/identity-mark";
import { createClient } from "@/lib/supabase/server";
import {
  NOTIFICATION_CATEGORY_ORDER,
  categoryEnabled,
  type NotificationCategory,
} from "@/lib/notifications";
import { LogOutButton } from "./log-out-button";
import { ProfileSections } from "./profile-sections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile" };

/**
 * Profile / Settings (blueprint 6.2).
 *
 * Where an employee manages their own account, and deliberately nothing cooperative-specific:
 * every figure on this screen belongs to the person, not to any cooperative they have joined.
 *
 * A short identity summary at the top, then the four sections, then Log out set apart at the
 * bottom. Each section saves independently. There is no Save button for this page as a whole,
 * because there is no state on this page as a whole.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "name, email, phone, employee_id, salary_gross, salary_net, salary_verified_at, notification_preferences, organizations(name, employee_id_label), documents!users_salary_source_doc_id_fkey(original_filename)",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const organization = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;
  const sourceDocument = Array.isArray(profile.documents)
    ? profile.documents[0]
    : profile.documents;

  const preferences = Object.fromEntries(
    NOTIFICATION_CATEGORY_ORDER.map((category) => [
      category,
      categoryEnabled(profile.notification_preferences, category),
    ]),
  ) as Record<NotificationCategory, boolean>;

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <header className="flex items-center gap-4">
        <IdentityMark name={profile.name} className="size-14 shrink-0" />

        <div className="min-w-0">
          <h1 className="type-page-title truncate text-text">{profile.name ?? "Your account"}</h1>
          {/* Wraps rather than truncates: the staff ID is the half a cooperative asks for, and
              on a narrow screen a truncating line is exactly where it would be lost. */}
          <p className="type-secondary mt-1 text-text-secondary">
            {organization?.name ?? "FMC Abeokuta"}
            {profile.employee_id
              ? ` · ${organization?.employee_id_label ?? "Staff ID"} ${profile.employee_id}`
              : ""}
          </p>
        </div>
      </header>

      <ProfileSections
        name={profile.name}
        email={profile.email ?? user.email ?? null}
        phone={profile.phone}
        salary={{
          gross: profile.salary_gross === null ? null : Number(profile.salary_gross),
          net: profile.salary_net === null ? null : Number(profile.salary_net),
          verifiedAt: profile.salary_verified_at,
          sourceFilename: sourceDocument?.original_filename ?? null,
        }}
        preferences={preferences}
      />

      {/* Set apart from the sections above by a rule and its own block of space. */}
      <div className="mt-12 border-t border-border pt-6">
        <LogOutButton />
      </div>
    </div>
  );
}
