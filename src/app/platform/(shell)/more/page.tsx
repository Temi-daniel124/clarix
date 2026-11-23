import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PLATFORM_ACCOUNT, PLATFORM_OVERSIGHT } from "@/components/platform-shell/destinations";
import { MoreScreen } from "@/components/shell/more-list";
import { loadShellContext, otherViewFor } from "@/lib/supabase/shell-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "More" };

/**
 * "More", super-admin blueprint Part 3, phone only. Holds exactly what the desktop sidebar and
 * its account menu show, in the same order.
 */
export default async function PlatformMorePage() {
  const shell = await loadShellContext();
  if (!shell) redirect("/login");

  return (
    <MoreScreen
      groups={[
        { label: "Oversight", entries: PLATFORM_OVERSIGHT },
        { label: "Account", entries: PLATFORM_ACCOUNT },
      ]}
      otherView={otherViewFor("platform", shell.identity)}
    />
  );
}
