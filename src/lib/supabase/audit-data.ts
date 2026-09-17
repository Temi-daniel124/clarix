import { createClient } from "@/lib/supabase/server";
import { describeAction, type AuditEntry, type AuditFilters } from "@/lib/audit";

/**
 * Cooperative Audit Log (admin blueprint 8.3).
 *
 * Reads `audit_log` directly, scoped by its own policy to the cooperative whose staff the caller
 * is. The table has no insert, update or delete policy at all (migration 014), so this screen is
 * read-only by construction rather than by restraint. There is no write path to withhold.
 */

export async function loadAuditLog(
  cooperativeId: string,
  filters: AuditFilters = {},
): Promise<AuditEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id, created_at, action, target_table, target_id, old_value, new_value, note, users(name, email)")
    .eq("cooperative_id", cooperativeId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59Z`);

  const { data } = await query;
  if (!data || data.length === 0) return [];

  // Resolve loan targets to the member they concern, so a reader sees a name rather than a uuid.
  const loanIds = data
    .filter((row) => row.target_table === "loans" && row.target_id)
    .map((row) => row.target_id as string);

  const subjects = new Map<string, { name: string | null; membershipId: string }>();

  if (loanIds.length > 0) {
    const { data: loans } = await supabase
      .from("loans")
      .select("id, membership_id, cooperative_memberships(user_id, users(name))")
      .in("id", loanIds);

    for (const loan of loans ?? []) {
      const membership = Array.isArray(loan.cooperative_memberships)
        ? loan.cooperative_memberships[0]
        : loan.cooperative_memberships;
      const person = membership
        ? Array.isArray(membership.users)
          ? membership.users[0]
          : membership.users
        : null;

      subjects.set(loan.id, {
        name: person?.name ?? null,
        membershipId: loan.membership_id,
      });
    }
  }

  const entries: AuditEntry[] = data.map((row) => {
    const actor = Array.isArray(row.users) ? row.users[0] : row.users;
    const subject = row.target_id ? subjects.get(row.target_id) : undefined;

    return {
      id: row.id,
      createdAt: row.created_at,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? null,
      action: row.action,
      targetTable: row.target_table,
      targetId: row.target_id,
      subjectName: subject?.name ?? null,
      subjectMembershipId: subject?.membershipId ?? null,
      ...diff(row.old_value, row.new_value),
      note: row.note,
    };
  });

  // The text search runs here rather than in the query: it has to match a member's name, which
  // lives two joins away from the log row, and the page is capped at 200 entries anyway.
  const needle = filters.query?.trim().toLowerCase();
  if (!needle) return entries;

  return entries.filter((entry) =>
    [entry.actorName, entry.actorEmail, entry.subjectName, describeAction(entry.action), entry.note]
      .filter(Boolean)
      .some((value) => (value as string).toLowerCase().includes(needle)),
  );
}

/**
 * What actually changed, old beside new: the blueprint asks for both rather than merely naming
 * that a change occurred, which is the difference between a log you can review and one you can
 * only count.
 *
 * A field that appears only in the new value is not a change: `over_cap` and `available_before`
 * are figures the decision recorded about itself, and drawing them with an arrow from nothing
 * would invent a "before" that never existed. They are returned separately and shown as context.
 */
function diff(
  oldValue: unknown,
  newValue: unknown,
): Pick<AuditEntry, "changes" | "context"> {
  const before = asRecord(oldValue);
  const after = asRecord(newValue);

  const changes: AuditEntry["changes"] = [];
  const context: AuditEntry["context"] = [];

  for (const field of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const from = format(before[field]);
    const to = format(after[field]);
    const label = field.replace(/_/g, " ");

    if (from !== null && to !== null) {
      if (from !== to) changes.push({ field: label, from, to });
      continue;
    }

    const only = to ?? from;
    if (only !== null) context.push({ field: label, value: only });
  }

  return { changes, context };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function format(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}
