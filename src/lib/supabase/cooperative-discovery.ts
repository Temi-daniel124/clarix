import { createClient } from "@/lib/supabase/server";

export type DiscoveryCard = {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  joined: boolean;
  membershipStatus: "pending" | "active" | "suspended" | null;
};

export type LoanProduct = {
  id: string;
  name: string;
  minSavingsRatio: number;
  maxTenureMonths: number;
  interestTerms: string | null;
};

export type DiscoveryProfile = {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  minSavingsRatioDefault: number;
  loanProducts: LoanProduct[];
  membershipStatus: "pending" | "active" | "suspended" | null;
};

/**
 * Discovery (blueprint 4.3) — every active cooperative at the employee's organization, with
 * whether they already hold a membership there.
 *
 * Everything returned is public-facing by design: a name, a description, joining requirements.
 * No financial data, because none exists for a non-member, and no other member's information
 * ever (MVP-SCOPE.md P0 #11, DECISIONS.md D003).
 */
export async function loadDiscoveryCards(): Promise<DiscoveryCard[] | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: cooperatives }, { data: memberships }] = await Promise.all([
    supabase
      .from("cooperatives")
      .select("id, name, description, requirements")
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .order("name"),
    supabase.from("cooperative_memberships").select("cooperative_id, status").eq("user_id", user.id),
  ]);

  const byId = new Map((memberships ?? []).map((row) => [row.cooperative_id, row.status]));

  return (cooperatives ?? []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    requirements: entry.requirements,
    joined: byId.has(entry.id),
    membershipStatus: byId.get(entry.id) ?? null,
  }));
}

/**
 * The Cooperative Discovery Profile (blueprint 4.4) — everything an employee needs to decide
 * whether to join one specific cooperative.
 *
 * Loan products come back filtered to the advertised ones. That filtering is the RLS policy's
 * doing, not a `.eq("is_public", true)` in this query: a cooperative may run products it does
 * not advertise, and the database is what decides an employee cannot see them.
 */
export async function loadDiscoveryProfile(
  cooperativeId: string,
): Promise<DiscoveryProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: cooperative }, { data: products }, { data: membership }] = await Promise.all([
    supabase
      .from("cooperatives")
      .select("id, name, description, requirements, min_savings_ratio_default, status")
      .eq("id", cooperativeId)
      .maybeSingle(),
    supabase
      .from("cooperative_loan_products")
      .select("id, name, min_savings_ratio, max_tenure_months, interest_terms")
      .eq("cooperative_id", cooperativeId)
      .order("min_savings_ratio"),
    supabase
      .from("cooperative_memberships")
      .select("status")
      .eq("user_id", user.id)
      .eq("cooperative_id", cooperativeId)
      .maybeSingle(),
  ]);

  if (!cooperative || cooperative.status !== "active") return null;

  return {
    id: cooperative.id,
    name: cooperative.name,
    description: cooperative.description,
    requirements: cooperative.requirements,
    minSavingsRatioDefault: Number(cooperative.min_savings_ratio_default),
    loanProducts: (products ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
      minSavingsRatio: Number(entry.min_savings_ratio),
      maxTenureMonths: entry.max_tenure_months,
      interestTerms: entry.interest_terms,
    })),
    membershipStatus: membership?.status ?? null,
  };
}
