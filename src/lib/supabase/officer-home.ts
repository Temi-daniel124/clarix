import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";

/**
 * The read behind Officer Home — officer blueprint 4.1.
 *
 * Deliberately not `loadCooperativeSummary`. That query answers "how is this cooperative doing",
 * and the blueprint is explicit that an officer's home is not that screen: "cooperative-wide
 * totals (total savings held, total membership count) are Admin-level information, not part of an
 * Officer's daily job". What an officer needs is what is waiting on them and what they have done
 * today, so that is all this asks for.
 *
 * Scoping, as everywhere else, is the policies' job. An officer without `can_view_members` cannot
 * read `cooperative_memberships`, and because `loans_select_staff` reaches the loan through its
 * membership, they cannot read the loans either — the empty result below is Postgres's answer,
 * not a filter written here (SECURITY.md).
 */

export type OfficerTask = {
  id: string;
  title: string;
  detail: string;
  href: string;
  waitingDays: number;
  urgent: boolean;
};

export type OfficerHomeData = {
  tasks: OfficerTask[];
  /** Members this officer personally recorded an entry against today. */
  recordedToday: number;
  /** Applications this cooperative received today, whoever started them. */
  applicationsToday: number;
};

export async function loadOfficerHome(
  cooperativeId: string,
  userId: string,
): Promise<OfficerHomeData> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("cooperative_memberships")
    .select("id, users(name, employee_id)")
    .eq("cooperative_id", cooperativeId);

  const membershipIds = (memberships ?? []).map((row) => row.id);

  if (membershipIds.length === 0) {
    return { tasks: [], recordedToday: 0, applicationsToday: 0 };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [{ data: loans }, { data: entries }] = await Promise.all([
    supabase
      .from("loans")
      .select("id, membership_id, status, requested_amount, created_at, reservation_expires_at")
      .in("membership_id", membershipIds),
    supabase
      .from("savings_transactions")
      .select("membership_id")
      .in("membership_id", membershipIds)
      .eq("recorded_by", userId)
      .gte("recorded_at", startOfDay),
  ]);

  const nameByMembership = new Map<string, string>();
  for (const membership of memberships ?? []) {
    const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;
    nameByMembership.set(membership.id, person?.name ?? person?.employee_id ?? "A member");
  }

  const tasks: OfficerTask[] = [];

  for (const loan of loans ?? []) {
    if (loan.status !== "reserved") continue;
    if (!loan.reservation_expires_at || new Date(loan.reservation_expires_at) <= now) continue;

    const expiresIn = daysBetween(now, new Date(loan.reservation_expires_at));

    tasks.push({
      id: loan.id,
      title: `${nameByMembership.get(loan.membership_id) ?? "A member"} is waiting on a decision`,
      detail:
        expiresIn <= 2
          ? `The hold on their capacity lapses in ${expiresIn === 0 ? "under a day" : `${expiresIn} ${expiresIn === 1 ? "day" : "days"}`}.`
          : `Applied for ${formatNaira(Number(loan.requested_amount))}.`,
      // Straight into the review screen rather than the queue: the blueprint's "don't lose the
      // context of why they clicked" rule, the same one the admin dashboard follows.
      href: `/admin/loans/${loan.id}`,
      waitingDays: daysBetween(new Date(loan.created_at), now),
      urgent: expiresIn <= 2,
    });
  }

  tasks.sort(
    (a, b) => Number(b.urgent) - Number(a.urgent) || b.waitingDays - a.waitingDays,
  );

  const applicationsToday = (loans ?? []).filter(
    (loan) => new Date(loan.created_at) >= new Date(startOfDay),
  ).length;

  return {
    tasks,
    recordedToday: new Set((entries ?? []).map((entry) => entry.membership_id)).size,
    applicationsToday,
  };
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}
