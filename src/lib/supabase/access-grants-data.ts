import { createClient } from "@/lib/supabase/server";
import { isLive, type AccessGrant } from "@/lib/access-grants";

/**
 * Reads behind Access Requests (7.2) and the Elevated Access View (7.3).
 *
 * `access_grants` is scoped by its own policies: the operator who asked, and the admin of the
 * cooperative named, so neither query below carries a `requested_by` filter. The screen is not
 * the boundary, as everywhere else in this product.
 */

type GrantRow = {
  id: string;
  cooperative_id: string;
  member_user_id: string | null;
  reason: string;
  status: "pending" | "active" | "expired" | "revoked";
  requested_at: string;
  activates_at: string;
  expires_at: string;
  revoked_at: string | null;
  requested_by: string;
};

export async function loadAccessGrants(): Promise<AccessGrant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("access_grants")
    .select(
      "id, cooperative_id, member_user_id, reason, status, requested_at, activates_at, expires_at, revoked_at, requested_by",
    )
    .order("requested_at", { ascending: false });

  if (error) throw new Error(`Could not read the access requests: ${error.message}`);

  const rows = (data ?? []) as GrantRow[];
  if (rows.length === 0) return [];

  // Cooperative names come from `cooperatives`, which every signed-in user may read: no elevation
  // needed and none taken.
  const { data: cooperatives } = await supabase
    .from("cooperatives")
    .select("id, name")
    .in("id", [...new Set(rows.map((row) => row.cooperative_id))]);

  const nameById = new Map((cooperatives ?? []).map((row) => [row.id, row.name]));

  // A member's name and their membership id are readable only while a grant is live, which is the
  // whole point, so a lapsed grant's row shows the cooperative and no person, and that is
  // correct rather than a gap.
  const memberIds = rows.map((row) => row.member_user_id).filter(Boolean) as string[];

  const members = new Map<string, { name: string | null; membershipId: string }>();

  if (memberIds.length > 0) {
    const { data: memberships } = await supabase
      .from("cooperative_memberships")
      .select("id, user_id, cooperative_id, users(name)")
      .in("user_id", [...new Set(memberIds)]);

    for (const membership of memberships ?? []) {
      const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;
      members.set(`${membership.cooperative_id}:${membership.user_id}`, {
        name: person?.name ?? null,
        membershipId: membership.id,
      });
    }
  }

  const { data: requesters } = await supabase
    .from("users")
    .select("id, name")
    .in("id", [...new Set(rows.map((row) => row.requested_by))]);

  const requesterById = new Map((requesters ?? []).map((row) => [row.id, row.name]));

  return rows.map((row) => {
    const member = row.member_user_id
      ? members.get(`${row.cooperative_id}:${row.member_user_id}`)
      : undefined;

    return {
      id: row.id,
      cooperativeId: row.cooperative_id,
      cooperativeName: nameById.get(row.cooperative_id) ?? "A cooperative",
      memberUserId: row.member_user_id,
      memberName: member?.name ?? null,
      membershipId: member?.membershipId ?? null,
      reason: row.reason,
      requestedBy: row.requested_by,
      requesterName: requesterById.get(row.requested_by) ?? null,
      requestedAt: row.requested_at,
      activatesAt: row.activates_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      stored: row.status,
    };
  });
}

/**
 * One grant, for the Elevated Access View to check before it renders anything.
 *
 * Returns null when the grant is not live at this instant, which is what makes 7.3 "stop
 * rendering the moment the grant expires" true rather than aspirational: the page asks this on
 * every request, and an expired grant is indistinguishable from one that never existed.
 */
export async function loadLiveGrant(grantId: string): Promise<AccessGrant | null> {
  const grants = await loadAccessGrants();
  const grant = grants.find((candidate) => candidate.id === grantId);

  if (!grant) return null;
  return isLive(grant) ? grant : null;
}

/** The cooperatives a request can name, for the form's picker. */
export async function loadCooperativeChoices(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("cooperatives").select("id, name").order("name");
  return data ?? [];
}
