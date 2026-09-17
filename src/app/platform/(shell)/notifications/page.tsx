import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { NotificationList } from "@/app/(app)/notifications/notification-list";
import { loadNotifications, relativeTime } from "@/lib/supabase/notifications-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

/**
 * Notifications (super-admin blueprint 9.1), reached from Part 3's navigation.
 *
 * The same table, query and component every other role uses, scoped by who a notification is
 * addressed to rather than by any role. It is here because the navigation this session built
 * needs it to lead somewhere real, and it needed no new code to do so.
 *
 * Nothing writes a platform-facing notification yet. The one writer that exists notifies the
 * member whose loan was decided, which is the employee side, so this screen says what it is
 * waiting for rather than being padded.
 */
export default async function PlatformNotificationsPage() {
  const notifications = await loadNotifications();

  const now = new Date();
  const timestamps = Object.fromEntries(
    notifications.map((item) => [item.id, relativeTime(item.createdAt, now)]),
  );

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="mt-8 rounded-feature border border-border bg-surface px-6 py-12 text-center md:px-10">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <BellOff className="size-5" strokeWidth={1.75} />
          </span>

          <h2 className="type-section mt-6 text-text">Nothing addressed to you yet</h2>

          <p className="type-body mx-auto mt-3 max-w-[460px] text-text-secondary">
            An admin taking up an invitation, and another platform admin asking for access to a
            cooperative&apos;s records, will appear here. Neither sends a notification yet, what
            needs you today is on the home screen instead.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <NotificationList items={notifications} timestamps={timestamps} />
        </div>
      )}
    </div>
  );
}
