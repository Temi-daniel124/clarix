import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  PlatformBottomTabs,
  PlatformSidebar,
  PlatformTopBar,
} from "@/components/platform-shell/platform-nav";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { landingPathFor } from "@/lib/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The Super Admin shell, super-admin blueprint Part 3.
 *
 * The redirect here is for people who have no business on these screens, not a security
 * boundary: every read behind them goes through a function that checks `is_platform_admin()`
 * itself, so an account that got past this layout would still see nothing (SECURITY.md).
 *
 * Somebody signed in without the platform flag is sent wherever they do belong rather than shown
 * an error, because holding an ordinary membership is the normal case and being refused by name
 * would be a worse answer than simply arriving in the right place.
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const staff = await loadStaffContext();
  if (!staff) redirect("/login");
  if (!staff.isPlatformAdmin) redirect(landingPathFor(staff.roles));

  return (
    <div className="flex min-h-dvh flex-1">
      <PlatformSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformTopBar />
        <main className="flex-1 pb-32 md:pb-12">{children}</main>
      </div>

      <PlatformBottomTabs />
    </div>
  );
}
