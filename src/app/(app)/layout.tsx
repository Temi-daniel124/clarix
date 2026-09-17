import { redirect } from "next/navigation";
import { AppBottomTabs, AppSidebar, AppTopBar } from "@/components/app-shell/app-nav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The authenticated app shell, blueprint Part 3.
 *
 * Every screen from the Dashboard onwards renders inside this: sidebar beside the content on
 * desktop, bottom tab bar below it on mobile. The content pane scrolls, the navigation does not.
 *
 * The session check here is a redirect for people who are not signed in, not a security
 * boundary. What any of these screens can actually read is decided by RLS
 * (SECURITY.md: "no feature may rely on a UI-side check alone").
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-1">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar />

        {/* The bottom padding clears the floating mobile tab pill. */}
        <main className="flex-1 pb-32 md:pb-12">{children}</main>
      </div>

      <AppBottomTabs />
    </div>
  );
}
