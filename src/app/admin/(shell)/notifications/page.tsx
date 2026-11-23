import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationList } from "@/app/(app)/notifications/notification-list";
import { loadNotifications, relativeTime } from "@/lib/supabase/notifications-data";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

/**
 * Notifications (admin blueprint 8.1), officer blueprint 8.1.
 *
 * "Structurally identical to the Employee role's Notifications screen", so it is literally the
 * same component over the same query: one notifications table, one read-and-mark-read pattern,
 * one unread dot. A second list UI would be two things to keep in step for no gain.
 *
 * **Nothing writes an admin-facing notification yet, and this screen says so rather than being
 * padded.** The one writer that exists, `decide_loan_application`, notifies the member whose
 * loan was decided, which is the employee side. The events this screen will carry (an application
 * arriving, a reservation nearing expiry, an invitation accepted) have no writer, and inventing
 * rows to make the screen feel populated is exactly what D025 ruled out when the table was empty
 * for everyone.
 *
 * What an admin needs today is on the dashboard: "Attention required" already lists applications
 * waiting, imports needing a name, and invitations nobody has taken up.
 *
 * The officer's version is the same screen and the same query. Their rows are scoped by the same
 * policy, keyed on who the notification is addressed to rather than on any role. Only the empty
 * state differs, because the events it is waiting for are different ones: an officer is told about
 * their own submitted applications and about a permission their admin changed, not about
 * invitations being taken up.
 */
export default async function AdminNotificationsPage() {
  const [notifications, staff] = await Promise.all([loadNotifications(), loadStaffContext()]);
  const isOfficer = preferredRole(staff?.roles ?? [])?.role === "officer";

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
            {isOfficer
              ? "An application you submitted changing status, a reservation you created nearing its expiry, and a change your admin makes to what you are allowed to do will appear here. None of those sends a notification yet, what is waiting on you today is on your home screen instead, which is fed from the same records."
              : "New applications, reservations approaching their expiry, and officers taking up an invitation will appear here. None of those sends a notification yet, what needs your attention today is on your cooperative's home screen instead, which is fed from the same records."}
          </p>

          <Button variant="secondary" className="mt-8" render={<Link href="/admin" />}>
            {isOfficer ? "See what is waiting on you" : "See what is waiting"}
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <NotificationList items={notifications} timestamps={timestamps} />
        </div>
      )}
    </div>
  );
}
