"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MarkState = { error?: string };

/**
 * "Mark all as read" — blueprint 6.1.
 *
 * A real UPDATE, not a client-side flag (DECISIONS.md D025): an employee who clears a backlog
 * on their phone must find it cleared on their laptop. `notifications_update_own` is what scopes
 * it to their own rows; the `is` filter only avoids rewriting timestamps on rows already read,
 * which would otherwise make every "read on" date jump to now.
 */
export async function markAllReadAction(): Promise<MarkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) {
    return { error: "We could not mark those as read. Please try again." };
  }

  revalidatePath("/notifications");
  return {};
}

/** Marks one notification read, on the way to wherever it leads. */
export async function markReadAction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  revalidatePath("/notifications");
}
