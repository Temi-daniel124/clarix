import { createClient } from "@/lib/supabase/server";
import type { NotificationCategory } from "@/lib/notifications";

/**
 * Reading notifications — blueprint 6.1.
 *
 * One query, ordered newest first, scoped by RLS to the signed-in employee
 * (`notifications_select_own`). There is no user filter in the query itself on purpose: the
 * policy is the boundary, and adding a redundant `.eq("user_id", …)` here would suggest the
 * screen is what keeps one person's notifications away from another's (SECURITY.md).
 */

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  message: string;
  targetUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function loadNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, category, message, target_url, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    category: row.category,
    message: row.message,
    targetUrl: row.target_url,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

/**
 * "3 hours ago", "yesterday", "12 September".
 *
 * Relative for anything inside a week, because that is the window where "how long ago" is the
 * question being asked; an absolute date after that, because "37 days ago" is arithmetic nobody
 * wanted to do.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  }).format(then);
}
