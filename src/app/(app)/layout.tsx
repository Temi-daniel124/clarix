import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { loadShellContext } from "@/lib/supabase/shell-context";

export const dynamic = "force-dynamic";

/**
 * The member app shell (DESIGN_SYSTEM §5.5, BUILD-PLAN 1.4): top bar and floating tab bar on
 * phones, the light sidebar from 1024px.
 *
 * The session check here is a redirect for people who are not signed in, not a security
 * boundary. What any of these screens can actually read is decided by RLS
 * (SECURITY.md: "no feature may rely on a UI-side check alone").
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const shell = await loadShellContext();
  if (!shell) redirect("/login");

  return (
    <AppShell kind="member" identity={shell.identity}>
      {children}
    </AppShell>
  );
}
