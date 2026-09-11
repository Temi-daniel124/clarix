import { createClient } from "@/lib/supabase/server";
import { computeCapacity, type Capacity } from "@/lib/eligibility";

export type JoinedCooperative = {
  membershipId: string;
  cooperativeId: string;
  name: string;
  status: "pending" | "active" | "suspended";
  savingsBalance: number;
  joinedAt: string | null;
};

export type Insight = {
  id: string;
  text: string;
  href: string | null;
};

export type DashboardData = {
  firstName: string | null;
  salaryConfirmed: boolean;
  capacity: Capacity;
  totalSavings: number;
  activeLoanCount: number;
  monthlyDeductions: number;
  cooperatives: JoinedCooperative[];
  unjoinedCount: number;
  /** When the figures above last changed, for the freshness line the blueprint asks for. */
  lastUpdated: string | null;
  insights: Insight[];
};

/**
 * Everything the Dashboard (blueprint 4.1) shows, in one place.
 *
 * On the three loan-derived figures — Active Loans, Monthly Deductions, and the committed half
 * of Available Capacity — the `loans` table does not exist yet; it arrives with the loan slice
 * (blueprint Part 5). Rather than invent placeholder numbers, committed obligations are read as
 * zero, which is not a stand-in but the truth: an employee with no loans recorded on Clarix owes
 * nothing through Clarix, so their whole cap is genuinely available. When loans land, the only
 * change here is that `committedMonthlyRepayments` starts summing real rows.
 *
 * Savings are real today, from the memberships each cooperative maintains.
 */
export async function loadDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(
      "name, salary_gross, salary_net, salary_verified_at, organization_id, organizations(deduction_basis, deduction_max_percentage)",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const organization = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const [{ data: memberships }, { count: cooperativeCount }] = await Promise.all([
    supabase
      .from("cooperative_memberships")
      .select("id, cooperative_id, status, savings_balance, joined_at, cooperatives(name)")
      .eq("user_id", user.id),
    supabase
      .from("cooperatives")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "active"),
  ]);

  const cooperatives: JoinedCooperative[] = (memberships ?? []).map((row) => {
    const cooperative = Array.isArray(row.cooperatives) ? row.cooperatives[0] : row.cooperatives;
    return {
      membershipId: row.id,
      cooperativeId: row.cooperative_id,
      name: cooperative?.name ?? "Cooperative",
      status: row.status,
      savingsBalance: Number(row.savings_balance ?? 0),
      joinedAt: row.joined_at,
    };
  });

  const activeMemberships = cooperatives.filter((entry) => entry.status === "active");
  const totalSavings = activeMemberships.reduce((sum, entry) => sum + entry.savingsBalance, 0);

  const capacity = computeCapacity({
    salary: { gross: profile.salary_gross, net: profile.salary_net },
    policy: {
      basis: organization?.deduction_basis ?? "gross",
      maxPercentage: Number(organization?.deduction_max_percentage ?? 0),
    },
    committedMonthlyRepayments: 0,
  });

  const lastUpdated = [
    profile.salary_verified_at,
    ...cooperatives.map((entry) => entry.joinedAt),
  ]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  return {
    firstName: profile.name?.trim().split(/\s+/)[0] ?? null,
    salaryConfirmed: Boolean(profile.salary_verified_at),
    capacity,
    totalSavings,
    activeLoanCount: 0,
    monthlyDeductions: 0,
    cooperatives,
    unjoinedCount: Math.max(0, (cooperativeCount ?? 0) - cooperatives.length),
    lastUpdated,
    insights: buildInsights({
      capacity,
      totalSavings,
      activeMembershipCount: activeMemberships.length,
      pending: cooperatives.filter((entry) => entry.status === "pending"),
      salaryConfirmed: Boolean(profile.salary_verified_at),
    }),
  };
}

/**
 * The Clarix Insights strip (blueprint 4.1).
 *
 * Every line here is derived from something the database actually holds. The blueprint's own
 * examples — "your savings grew ₦40,000 this month", "you're 73% through your Cooperative A
 * loan" — need `savings_transactions` and `loans`, neither of which exists yet, so those are not
 * written as placeholder copy. On a product whose entire claim is that its numbers are true, a
 * plausible-looking invented insight is worse than no insight, so when nothing can be said
 * truthfully this returns an empty list and the strip does not render at all.
 */
function buildInsights({
  capacity,
  totalSavings,
  activeMembershipCount,
  pending,
  salaryConfirmed,
}: {
  capacity: Capacity;
  totalSavings: number;
  activeMembershipCount: number;
  pending: JoinedCooperative[];
  salaryConfirmed: boolean;
}): Insight[] {
  const insights: Insight[] = [];

  if (pending.length === 1) {
    insights.push({
      id: "pending-one",
      text: `Your application to ${pending[0].name} is waiting for that cooperative to review it.`,
      href: "/cooperatives",
    });
  } else if (pending.length > 1) {
    insights.push({
      id: "pending-many",
      text: `${pending.length} of your applications are waiting for review.`,
      href: "/cooperatives",
    });
  }

  if (salaryConfirmed && capacity.cap > 0) {
    insights.push({
      id: "capacity",
      text: `Nothing is committed against your salary through Clarix yet, so your full monthly limit is available.`,
      href: null,
    });
  }

  if (activeMembershipCount > 0 && totalSavings > 0) {
    insights.push({
      id: "savings",
      text: `Your savings are recorded across ${activeMembershipCount} ${
        activeMembershipCount === 1 ? "cooperative" : "cooperatives"
      }.`,
      href: "/cooperatives",
    });
  }

  return insights.slice(0, 3);
}
