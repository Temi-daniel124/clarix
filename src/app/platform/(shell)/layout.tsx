import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { loadShellContext } from "@/lib/supabase/shell-context";
import { landingPathFor } from "@/lib/staff";

export const dynamic = "force-dynamic";

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
  const shell = await loadShellContext();
  if (!shell) redirect("/login");
  if (!shell.staff.isPlatformAdmin) redirect(landingPathFor(shell.staff.roles));

  return (
    <AppShell kind="platform" identity={shell.identity}>
      {children}
    </AppShell>
  );
}
