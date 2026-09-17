import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminProfileSections } from "@/components/admin/admin-profile-sections";
import { OfficerRolePanel } from "@/components/admin/officer-role-panel";
import { IdentityMark } from "@/components/clarix/identity-mark";
import { LogOutButton } from "@/app/(app)/profile/log-out-button";
import { createClient } from "@/lib/supabase/server";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import {
  NOTIFICATION_CATEGORY_ORDER,
  categoryEnabled,
  type NotificationCategory,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile" };

/**
 * Profile / Settings (admin blueprint 8.2), officer blueprint 8.2.
 *
 * One screen for both staff roles, because the personal-information, security and
 * notification-preference sections are the same account's in either case. What the officer
 * blueprint adds is one panel above them: a read-only summary of what this person is currently
 * permitted to do here, which an admin has no use for because an admin holds everything.
 */
export default async function AdminProfilePage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("users").select("name, email, phone, notification_preferences").eq("id", user.id).maybeSingle(),
    supabase.from("cooperative_memberships").select("id").eq("user_id", user.id),
  ]);

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
            {role.role === "admin" ? "Admin" : (role.title ?? "Officer")} at {role.cooperativeName}
          </p>
        </div>
      </header>

      {role.role === "officer" ? (
        <OfficerRolePanel
          cooperativeName={role.cooperativeName}
          title={role.title}
          permissions={role.permissions}
        />
      ) : null}

      <AdminProfileSections
        name={profile?.name ?? null}
        email={profile?.email ?? user.email ?? null}
        phone={profile?.phone ?? null}
        preferences={preferences}
        memberCooperativeCount={(memberships ?? []).length}
        staffRole={role.role}
      />

      <div className="mt-12 border-t border-border pt-6">
        <LogOutButton />
      </div>
    </div>
  );
}
