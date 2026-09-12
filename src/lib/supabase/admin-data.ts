import { createClient } from "@/lib/supabase/server";
import { readsCanApproveLoans } from "@/lib/staff";
import type { LoanProduct } from "@/components/admin/loan-products-manager";
import type { OfficerRow, PendingInvitation } from "@/components/admin/officer-invites";

/**
 * Reads for the cooperative-admin screens. Every one is scoped by the same RLS the employee side
 * uses — `is_active_staff(cooperative_id)` — so these queries return this cooperative's rows
 * because the policy says so, not because the filter does.
 */

export async function loadLoanProducts(cooperativeId: string): Promise<LoanProduct[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cooperative_loan_products")
    .select("id, name, min_savings_ratio, max_tenure_months, interest_terms, is_public")
    .eq("cooperative_id", cooperativeId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    minSavingsRatio: Number(row.min_savings_ratio),
    maxTenureMonths: row.max_tenure_months,
    interestTerms: row.interest_terms,
    isPublic: row.is_public,
  }));
}

/**
 * What other cooperatives require, for the "this looks unusual" warning on blueprint 2.3.
 *
 * It reads only public products, which every signed-in account can already see on Discovery, and
 * only their ratios — no cooperative is named and nothing private is involved. Returns null when
 * there is nothing to compare against, so the warning stays silent rather than inventing a norm
 * out of one data point.
 */
export async function loadPeerRatioRange(
  cooperativeId: string,
): Promise<{ min: number; max: number } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cooperative_loan_products")
    .select("min_savings_ratio")
    .neq("cooperative_id", cooperativeId)
    .eq("is_public", true);

  const ratios = (data ?? []).map((row) => Number(row.min_savings_ratio)).filter(Number.isFinite);
  if (ratios.length < 2) return null;

  return { min: Math.min(...ratios), max: Math.max(...ratios) };
}

export async function loadOfficers(cooperativeId: string): Promise<OfficerRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cooperative_staff_roles")
    .select("id, status, title, permissions, users(name, email)")
    .eq("cooperative_id", cooperativeId)
    .eq("role", "officer")
    .neq("status", "revoked")
    .order("invited_at", { ascending: true });

  return (data ?? []).map((row) => {
    const person = Array.isArray(row.users) ? row.users[0] : row.users;

    return {
      id: row.id,
      name: person?.name ?? null,
      email: person?.email ?? null,
      title: row.title,
      status: row.status === "active" ? "active" : "invited",
      canApproveLoans: readsCanApproveLoans(row.permissions),
    };
  });
}

export async function loadPendingInvitations(
  cooperativeId: string,
): Promise<PendingInvitation[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("staff_invitations")
    .select("id, email, title, permissions, invited_at")
    .eq("cooperative_id", cooperativeId)
    .is("claimed_at", null)
    .order("invited_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    title: row.title,
    canApproveLoans: readsCanApproveLoans(row.permissions),
    invitedAt: row.invited_at,
  }));
}

export type CooperativeProfile = {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
};

export async function loadCooperativeProfile(
  cooperativeId: string,
): Promise<CooperativeProfile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cooperatives")
    .select("id, name, description, requirements")
    .eq("id", cooperativeId)
    .maybeSingle();

  return data ?? null;
}

/** The organization's staff-ID rule, which the import validates every row against. */
export async function loadEmployeeIdPattern(): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("organizations")
    .select("employee_id_pattern")
    .limit(1)
    .maybeSingle();

  return data?.employee_id_pattern ?? "^[0-9]{6}$";
}

/** One line per public product, for the Discovery preview's Benefits section. */
export function summariseProducts(products: LoanProduct[]): string[] {
  return products
    .filter((product) => product.isPublic)
    .map(
      (product) =>
        `${product.name} — save ${Math.round(product.minSavingsRatio * 100)}% first, repay over up to ${product.maxTenureMonths} months`,
    );
}
