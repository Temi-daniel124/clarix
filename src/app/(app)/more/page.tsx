import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SECONDARY_DESTINATIONS } from "@/components/app-shell/destinations";
import { MoreScreen } from "@/components/shell/more-list";
import { loadShellContext, otherViewFor } from "@/lib/supabase/shell-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "More" };

/**
 * "More", member blueprint Part 3: a phone-only space-saving device, not a fifth area. It holds
 * what the desktop sidebar and its account menu show directly.
 */
export default async function MorePage() {
  const shell = await loadShellContext();
  if (!shell) redirect("/login");

  return (
    <MoreScreen
      groups={[{ entries: SECONDARY_DESTINATIONS }]}
      otherView={otherViewFor("member", shell.identity)}
    />
  );
}
