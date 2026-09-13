import type { Metadata } from "next";
import {
  PlatformDashboard,
  type ActivityItem,
  type AttentionItem,
} from "@/components/platform/platform-dashboard";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { daysSince, inviteAddressee, inviteSentAt, invitePending } from "@/lib/platform";
import { loadCooperativeDirectory, loadPlatformOverview } from "@/lib/supabase/platform-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Platform" };

/**
 * Platform Dashboard — super-admin blueprint 4.1.
 *
 * The PWA install prompt lives here (blueprint 1.3), reusing the same mechanic every other role
 * uses. The blueprint notes plainly that installing matters less for this role, which is used
 * from a desk; it appears on the same schedule anyway rather than being quietly suppressed.
 *
 * "Attention required" watches invitations only. Access requests are Part 7 and do not exist, so
 * the section says so rather than implying it is watching something it is not.
 */
export default async function PlatformHomePage() {
  const [overview, directory] = await Promise.all([
    loadPlatformOverview(),
    loadCooperativeDirectory(),
  ]);

  const attention: AttentionItem[] = directory
    .filter(invitePending)
    .map((entry) => ({ entry, waiting: daysSince(inviteSentAt(entry)) }))
    // Three days is the same threshold the cooperative dashboard uses before it calls an
    // unaccepted invitation somebody's problem.
    .filter((item) => (item.waiting ?? 0) >= 3)
    .sort((a, b) => (b.waiting ?? 0) - (a.waiting ?? 0))
    .map(({ entry, waiting }) => ({
      id: entry.id,
      title: `${entry.name} has not taken up its admin invitation`,
      detail: `${inviteAddressee(entry) ?? "The invited address"} was invited ${waiting} days ago. Nothing has reached them by email yet.`,
      href: `/platform/cooperatives/${entry.id}`,
    }));

  const activity: ActivityItem[] = directory
    .flatMap<ActivityItem>((entry) => {
      const events: ActivityItem[] = [
        {
          id: `${entry.id}-created`,
          text: `${entry.name} was added to the platform`,
          when: entry.createdAt,
        },
      ];

      if (entry.adminAcceptedAt) {
        events.push({
          id: `${entry.id}-accepted`,
          text: `${entry.adminName ?? entry.adminEmail ?? "An admin"} took up the admin role at ${entry.name}`,
          when: entry.adminAcceptedAt,
        });
      }

      return events;
    })
    .sort((a, b) => b.when.localeCompare(a.when))
    .slice(0, 6)
    .map((item) => ({ ...item, when: formatWhen(item.when) }));

  return (
    <>
      <div className="mx-auto w-full max-w-[1000px] px-5 pt-8 md:px-8 md:pt-10">
        <InstallPrompt />
      </div>

      <PlatformDashboard overview={overview} attention={attention} activity={activity} />
    </>
  );
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
