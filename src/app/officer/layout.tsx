import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/clarix/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { pendingInvites, preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";

/**
 * Shell for the officer's first-run tour — officer blueprint 2.1.
 *
 * The same quiet single column the admin setup sequence uses, and outside the app shell for the
 * same reason: a first-run screen wrapped in a navigation bar invites wandering off before it has
 * said the one thing it exists to say.
 *
 * The day-to-day officer screens are not here. An officer works in the same screens an admin
 * works in, behind the same policies, with a navigation that leaves out the configuration layer
 * — so this route group holds only what is genuinely the officer's own.
 */
export default async function OfficerLayout({ children }: { children: ReactNode }) {
  const staff = await loadStaffContext();
  if (!staff) redirect("/login");

  const role = preferredRole(staff.roles);
  if (!role) {
    if (pendingInvites(staff.roles).length > 0) redirect("/invite");
    redirect("/dashboard");
  }

  // An admin has their own setup sequence and does not need this orientation.
  if (role.role !== "officer") redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 py-6 md:px-8">
        <Link href="/admin" aria-label="Cooperative home" className="min-w-0">
          <Wordmark />
          <span className="mt-1 block truncate type-caption text-text-muted">
            {role.cooperativeName}
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 pb-20 md:px-8">{children}</main>
    </div>
  );
}
