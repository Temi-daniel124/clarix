import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadNotifications, relativeTime } from "@/lib/supabase/notifications-data";
import { NotificationList } from "./notification-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

/**
 * Notifications (blueprint 6.1).
 *
 * One place for anything that needs the employee's attention, newest first, each row leading
 * straight to the thing it concerns.
 *
 * **This screen is genuinely empty today, and that is expected** (DECISIONS.md D025). The table,
 * its RLS and this list are all real, but nothing in the employee blueprint writes a row: every
 * writer: a loan approved or rejected, a membership accepted, a new package published, belongs
 * to the cooperative admin/officer blueprint, which does not exist yet. No rows are seeded to
 * make the screen demonstrate better, for the same reason the dashboard's trend indicator said
 * "No history yet" rather than drawing an invented line.
 *
 * So the empty state below says what will appear here and why nothing has, rather than "no
 * data", DESIGN_SYSTEM.md asks an empty state to explain what happens next.
 */
export default async function NotificationsPage() {
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

          <h2 className="type-section mt-6 text-text">Nothing to tell you yet</h2>

          <p className="type-body mx-auto mt-3 max-w-[440px] text-text-secondary">
            Decisions on your loan applications, replies to requests to join a cooperative, and
            new packages from cooperatives you belong to will appear here. Each one will take you
            straight to what it is about.
          </p>

          <p className="type-secondary mx-auto mt-4 max-w-[440px] text-text-muted">
            Cooperatives cannot make those decisions inside Clarix yet, so there is nothing
            waiting for you. This page stays empty until they can. It is not hiding anything.
          </p>

          <Button variant="secondary" className="mt-8" render={<Link href="/profile" />}>
            Choose what you hear about
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
