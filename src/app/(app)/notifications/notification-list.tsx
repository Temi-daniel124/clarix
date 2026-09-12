"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications";
import type { NotificationItem } from "@/lib/supabase/notifications-data";
import { markAllReadAction, markReadAction } from "./actions";

/**
 * The notification list — blueprint 6.1.
 *
 * Reverse chronological, each row a category icon, the message, and a relative timestamp.
 * Unread is "a small dot rather than a loud badge count", which is the blueprint's own wording
 * and the same restraint the rest of the product shows about alarming people over money.
 *
 * A row that leads somewhere is a link; a row that does not is not. Nothing here is dressed as
 * tappable when tapping it would do nothing.
 */
export function NotificationList({
  items,
  timestamps,
}: {
  items: NotificationItem[];
  /** Pre-formatted on the server, so the list does not re-render every time a minute passes. */
  timestamps: Record<string, string>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [marking, startMarking] = useTransition();
  const unread = items.filter((item) => item.readAt === null).length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="type-secondary text-text-secondary">
          {unread === 0
            ? "Nothing unread."
            : `${unread} unread ${unread === 1 ? "notification" : "notifications"}.`}
        </p>

        {unread > 0 ? (
          <form
            action={() =>
              startMarking(async () => {
                const result = await markAllReadAction();
                setError(result.error ?? null);
              })
            }
          >
            <button
              type="submit"
              disabled={marking}
              className="type-secondary font-medium text-indigo underline-offset-4 transition-colors duration-150 hover:underline disabled:text-text-muted disabled:no-underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
            >
              {marking ? "Marking…" : "Mark all as read"}
            </button>
          </form>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 type-secondary text-danger">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-border rounded-feature border border-border bg-surface">
        {items.map((item) => (
          <li key={item.id}>
            <Row item={item} timestamp={timestamps[item.id] ?? ""} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ item, timestamp }: { item: NotificationItem; timestamp: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const descriptor = NOTIFICATION_CATEGORIES[item.category];
  const Icon = descriptor.icon;
  const unread = item.readAt === null;

  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-card border",
          unread ? "border-emerald/30 text-emerald" : "border-border text-text-muted",
        )}
        style={
          unread
            ? { backgroundColor: "color-mix(in srgb, var(--clarix-brand-accent) 10%, transparent)" }
            : undefined
        }
      >
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn("block type-body", unread ? "font-medium text-text" : "text-text-secondary")}>
          {item.message}
        </span>
        <span className="mt-1 flex items-center gap-2 type-caption text-text-muted">
          {descriptor.label}
          <span aria-hidden>·</span>
          {timestamp}
        </span>
      </span>

      {unread ? (
        <span
          aria-label="Unread"
          role="img"
          className="mt-1 size-2 shrink-0 rounded-full bg-emerald"
        />
      ) : null}

      {item.targetUrl ? (
        <ChevronRight aria-hidden strokeWidth={2} className="size-4 shrink-0 text-text-muted" />
      ) : null}
    </>
  );

  if (!item.targetUrl) {
    return <div className="flex items-start gap-4 px-5 py-4">{body}</div>;
  }

  return (
    <Link
      href={item.targetUrl}
      onClick={(event) => {
        // Mark read on the way through, then navigate — so the dot is gone when they come back.
        if (unread) {
          event.preventDefault();
          startTransition(async () => {
            await markReadAction(item.id);
            router.push(item.targetUrl as string);
          });
        }
      }}
      className="flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
    >
      {body}
    </Link>
  );
}
