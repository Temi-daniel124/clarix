import { createClient } from "@/lib/supabase/server";
import {
  describePlatformAction,
  type PlatformAuditFilters,
  type PlatformEvent,
} from "@/lib/platform-audit";

/**
 * Reads behind the Super Admin's oversight and administration screens — blueprint 6.1, 7.1, 8.1.
 *
 * The organization row is readable by anybody signed in (`organizations_select_authenticated`),
 * because onboarding needs the staff-ID pattern and every eligibility figure needs the deduction
 * basis and cap. Reading it here needs no elevation; writing it is what
 * `organizations_update_platform_admin` governs.
 *
 * The other two go through elevated functions, and SECURITY.md says why each one had to.
 */

export type DeductionPolicy = {
  id: string;
  name: string;
  deductionBasis: "gross" | "net";
  deductionMaxPercentage: number;
  employeeIdLabel: string;
  employeeIdPattern: string;
  reservationExpiryDaysDefault: number;
};

export async function loadDeductionPolicy(): Promise<DeductionPolicy | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, deduction_basis, deduction_max_percentage, employee_id_label, employee_id_pattern, reservation_expiry_days_default",
    )
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Could not read the organization policy: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    deductionBasis: data.deduction_basis,
    deductionMaxPercentage: Number(data.deduction_max_percentage),
    employeeIdLabel: data.employee_id_label,
    employeeIdPattern: data.employee_id_pattern,
    reservationExpiryDaysDefault: data.reservation_expiry_days_default,
  };
}

export type PlatformAdminRow = {
  userId: string;
  name: string | null;
  email: string | null;
  grantedAt: string;
};

export async function loadPlatformAdmins(): Promise<PlatformAdminRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_platform_admins");

  if (error) throw new Error(`Could not read the platform admins: ${error.message}`);

  return (data ?? []).map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    grantedAt: row.granted_at,
  }));
}

/**
 * Platform Audit Log — blueprint 7.1.
 *
 * Reads `audit_log` directly. No filter here says "platform rows only": `audit_log_select_platform`
 * does, by admitting a platform admin to rows whose `cooperative_id` is null and nothing else. A
 * cooperative's own entries are invisible to this query because the policy refuses them, not
 * because the query declined to ask.
 */
export async function loadPlatformAuditLog(
  filters: PlatformAuditFilters = {},
): Promise<PlatformEvent[]> {
  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select(
      "id, created_at, action, target_table, target_id, old_value, new_value, note, users(name, email)",
    )
    .is("cooperative_id", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00Z`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59Z`);

  const { data, error } = await query;
  if (error) throw new Error(`Could not read the platform audit log: ${error.message}`);

  const events: PlatformEvent[] = (data ?? []).map((row) => {
    const actor = Array.isArray(row.users) ? row.users[0] : row.users;

    return {
      id: row.id,
      createdAt: row.created_at,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? null,
      action: row.action,
      targetTable: row.target_table,
      targetId: row.target_id,
      ...diff(row.old_value, row.new_value),
      note: row.note,
    };
  });

  const needle = filters.query?.trim().toLowerCase();
  if (!needle) return events;

  return events.filter((event) =>
    [event.actorName, event.actorEmail, describePlatformAction(event.action), event.note]
      .concat(event.changes.map((change) => `${change.field} ${change.from} ${change.to}`))
      .concat(event.context.map((item) => `${item.field} ${item.value}`))
      .filter(Boolean)
      .some((value) => (value as string).toLowerCase().includes(needle)),
  );
}

/**
 * What changed, old beside new — the same distinction the cooperative log draws. A field present
 * only in the new value is not a change: "the name of the cooperative that was created" never had
 * a before, and drawing an arrow from nothing would invent one.
 */
function diff(
  oldValue: unknown,
  newValue: unknown,
): Pick<PlatformEvent, "changes" | "context"> {
  const before = asRecord(oldValue);
  const after = asRecord(newValue);

  const changes: PlatformEvent["changes"] = [];
  const context: PlatformEvent["context"] = [];

  for (const field of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const from = format(before[field]);
    const to = format(after[field]);

    if (from !== null && to !== null) {
      if (from !== to) changes.push({ field, from, to });
      continue;
    }

    const only = to ?? from;
    if (only !== null) context.push({ field, value: only });
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
