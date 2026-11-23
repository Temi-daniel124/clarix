import { createClient, getRequestUser } from "@/lib/supabase/server";
import { latestChange } from "@/lib/home-figures";
import { computeCapacity, type Capacity } from "@/lib/eligibility";
import type { TrendPoint } from "@/components/clarix/trend-indicator";
import { loadCapacity, loadLoans, type LoanSummary } from "./loans-data";
import { summariseLoans } from "@/lib/loan-status";
import { buildSavingsTrend } from "@/lib/savings-trend";

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
    // Only this member's own ledger (walkthrough 1.4d item 2). Without the filter, RLS also returns
    // every member's entries to someone who is staff at a cooperative, and the home showed that
    // cooperative's growth as this person's.
    supabase
      .from("savings_transactions")
      .select("amount, type, recorded_at, membership_id, cooperative_memberships!inner(user_id)")
      .eq("cooperative_memberships.user_id", user.id)
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

  // The same count and committed sum the member's Loans screen and the cooperative's Members list
  // show (walkthrough 1.4d item 1): active loans, plus reservations that have not lapsed.
  const loanFigures = summariseLoans(loans);

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
      committedMonthlyRepayments: loanFigures.committedMonthly,
    });

  // BUILD-PLAN 0.5 rule 2: the figures above last changed when a ledger entry or a loan last did
  // (or the member's income, which sets the limit). Joining a cooperative, which this used to read,
  // changes none of them, and is why the live home said "Current as of 15 March" in November.
  const lastUpdated = latestChange([
    profile.salary_verified_at,
    ...(ledger ?? []).map((entry) => entry.recorded_at),
    ...loans.flatMap((loan) => [
      loan.createdAt,
      loan.reservedAt,
      loan.approvedAt,
      loan.rejectedAt,
      loan.completedAt,
    ]),
  ]);

  return {
    organizationName: organization?.name ?? "your organization",
    employeeId: profile.employee_id,
    savingsTrend: buildSavingsTrend(ledger ?? [], totalSavings),
    firstName: profile.name?.trim().split(/\s+/)[0] ?? null,
    salaryConfirmed: Boolean(profile.salary_verified_at),
    capacity,
    totalSavings,
    activeLoanCount: loanFigures.activeCount,
    monthlyDeductions: loanFigures.committedMonthly,
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

/** Naira for insight copy. Kept local so this module has no dependency on a React component. */
function formatNairaPlain(value: number): string {
  return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;
}
