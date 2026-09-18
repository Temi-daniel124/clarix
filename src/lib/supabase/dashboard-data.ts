import { createClient, getRequestUser } from "@/lib/supabase/server";
import { computeCapacity, type Capacity } from "@/lib/eligibility";
import type { TrendPoint } from "@/components/clarix/trend-indicator";
import { loadCapacity, loadLoans, type LoanSummary } from "./loans-data";

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
  /** Month-end savings balance, oldest first, built from recorded contributions. */
  savingsTrend: TrendPoint[];
  organizationName: string;
  employeeId: string | null;
};

/**
 * Everything the Dashboard (blueprint 4.1) shows, in one place.
 *
 * Every figure here is now real. Capacity comes from `capacity_for_user`, the SECURITY DEFINER
 * function that sums committed obligations across every cooperative the employee belongs to,
 * the one calculation that deliberately crosses cooperative lines, and only ever as an aggregate
 * (DECISIONS.md D003). Active loans and monthly deductions come from the same loan rows.
 *
 * Savings come from the memberships each cooperative maintains.
 */
export async function loadDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();

  const user = await getRequestUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(
      "name, employee_id, salary_gross, salary_net, salary_verified_at, organization_id, organizations(name, deduction_basis, deduction_max_percentage)",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const organization = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const [{ data: memberships }, { count: cooperativeCount }, capacityFromDb, loans, { data: ledger }] =
    await Promise.all([
    supabase
      .from("cooperative_memberships")
      .select("id, cooperative_id, status, savings_balance, joined_at, cooperatives(name)")
      .eq("user_id", user.id),
    supabase
      .from("cooperatives")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("status", "active"),
    loadCapacity(),
    loadLoans(),
    supabase
      .from("savings_transactions")
      .select("amount, type, recorded_at, membership_id")
      .order("recorded_at", { ascending: true }),
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

  // Loans that currently hold capacity: active, plus reservations that have not lapsed.
  const committing = loans.filter(
    (loan) =>
      loan.status === "active" ||
      (loan.status === "reserved" &&
        loan.reservationExpiresAt !== null &&
        new Date(loan.reservationExpiresAt) > new Date()),
  );

  // The database function is the source of truth, because only it can see across cooperatives.
  // computeCapacity() is the same arithmetic from src/lib/eligibility.ts and stands in if the
  // call fails, so a dropped RPC degrades to a figure derived from what this session can read
  // rather than to a blank screen.
  const capacity =
    capacityFromDb ??
    computeCapacity({
      salary: { gross: profile.salary_gross, net: profile.salary_net },
      policy: {
        basis: organization?.deduction_basis ?? "gross",
        maxPercentage: Number(organization?.deduction_max_percentage ?? 0),
      },
      committedMonthlyRepayments: committing.reduce((sum, l) => sum + l.monthlyRepayment, 0),
    });

  const lastUpdated = [
    profile.salary_verified_at,
    ...cooperatives.map((entry) => entry.joinedAt),
  ]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;

  return {
    organizationName: organization?.name ?? "your organization",
    employeeId: profile.employee_id,
    savingsTrend: buildSavingsTrend(ledger ?? []),
    firstName: profile.name?.trim().split(/\s+/)[0] ?? null,
    salaryConfirmed: Boolean(profile.salary_verified_at),
    capacity,
    totalSavings,
    activeLoanCount: loans.filter((loan) => loan.status === "active").length,
    monthlyDeductions: committing.reduce((sum, loan) => sum + loan.monthlyRepayment, 0),
    cooperatives,
    unjoinedCount: Math.max(0, (cooperativeCount ?? 0) - cooperatives.length),
    lastUpdated,
    insights: buildInsights({
      capacity,
      totalSavings,
      activeMembershipCount: activeMemberships.length,
      pending: cooperatives.filter((entry) => entry.status === "pending"),
      salaryConfirmed: Boolean(profile.salary_verified_at),
      loans,
    }),
  };
}

/**
 * The Clarix Insights strip (blueprint 4.1).
 *
 * Every line is derived from something the database actually holds, and every line has to stay
 * true as the data changes. The capacity line below is a case in point: it originally read
 * "nothing is committed against your salary yet" on the sole condition that a salary had been
 * confirmed, which quietly became false the moment a loan existed. It is now conditioned on the
 * committed figure itself, and there is a separate, equally true line for when something IS
 * committed.
 */
function buildInsights({
  capacity,
  totalSavings,
  activeMembershipCount,
  pending,
  salaryConfirmed,
  loans,
}: {
  capacity: Capacity;
  totalSavings: number;
  activeMembershipCount: number;
  pending: JoinedCooperative[];
  salaryConfirmed: boolean;
  loans: LoanSummary[];
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

  // A reservation holding capacity is the most time-sensitive thing on the screen, so it leads.
  const held = loans.filter(
    (loan) =>
      loan.status === "reserved" &&
      loan.reservationExpiresAt !== null &&
      new Date(loan.reservationExpiresAt) > new Date(),
  );

  if (held.length > 0) {
    insights.push({
      id: "held",
      text: `${formatNairaPlain(
        held.reduce((sum, loan) => sum + loan.monthlyRepayment, 0),
      )} a month is held against your limit while ${
        held.length === 1 ? held[0].cooperativeName : `${held.length} cooperatives`
      } decide.`,
      href: "/loans",
    });
  }

  // The furthest-along active loan is worth surfacing, and it is a real, checkable figure.
  const mostRepaid = loans
    .filter((loan) => loan.status === "active" && loan.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];

  if (mostRepaid) {
    insights.push({
      id: "progress",
      text: `You are ${Math.round(mostRepaid.progress * 100)}% through your ${
        mostRepaid.cooperativeName
      } loan.`,
      href: `/loans/${mostRepaid.id}`,
    });
  }

  if (salaryConfirmed && capacity.cap > 0 && capacity.committed === 0) {
    insights.push({
      id: "capacity-free",
      text: "Nothing is committed against your salary through Clarix, so your full monthly limit is available.",
      href: null,
    });
  }

  if (activeMembershipCount > 0 && totalSavings > 0 && insights.length < 3) {
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

/**
 * Month-end savings balance, oldest first, for the sparkline.
 *
 * Only contributions and recorded withdrawals move a savings balance: a loan repayment leaves
 * the salary and does not add to savings, so it is excluded. Fewer than two months of history
 * returns nothing, and the card shows its honest empty state rather than a single flat point.
 */
function buildSavingsTrend(
  ledger: Array<{ amount: number; type: string; recorded_at: string }>,
): TrendPoint[] {
  const savings = ledger.filter(
    (row) => row.type === "contribution" || row.type === "withdrawal_record",
  );
  if (savings.length < 2) return [];

  const byMonth = new Map<string, number>();
  let running = 0;

  for (const row of savings) {
    running += row.type === "contribution" ? Number(row.amount) : -Number(row.amount);
    byMonth.set(row.recorded_at.slice(0, 7), running);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ at: month, value }));
}

/** Naira for insight copy. Kept local so this module has no dependency on a React component. */
function formatNairaPlain(value: number): string {
  return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;
}
