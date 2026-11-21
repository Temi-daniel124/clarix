import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/clarix/wordmark";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { pendingInvites, preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";

/**
 * Shell for the admin setup sequence (admin blueprint 2.1 to 2.5).
 *
 * Single-column and quiet, and deliberately outside the admin app shell: a wizard wrapped in a
 * navigation bar invites wandering off halfway through, which is exactly what the employee
 * onboarding shell avoids for the same reason.
 *
 * Only a cooperative's admin belongs here. An officer has no cooperative-level settings to set
 * up, so they go straight to the app.
 */
export default async function AdminSetupLayout({ children }: { children: ReactNode }) {
  const staff = await loadStaffContext();
  if (!staff) redirect("/login");

  const role = preferredRole(staff.roles);
  if (!role) {
    if (pendingInvites(staff.roles).length > 0) redirect("/invite");
    redirect("/dashboard");
  }
  if (role.role !== "admin") redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 py-6 md:px-8">
        <Link href="/admin" aria-label="Cooperative home" className="min-w-0">
          <Wordmark />
          <span className="mt-1 block truncate type-caption text-text-muted">
            {role.cooperativeName}
          </span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-20 md:px-8">{children}</main>
    </div>
  );
}
