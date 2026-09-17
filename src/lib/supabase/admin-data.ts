import { createClient } from "@/lib/supabase/server";
import { readsCanApproveLoans } from "@/lib/staff";
import { readPermissions } from "@/lib/permissions";
import type { LoanProduct } from "@/components/admin/loan-products-manager";
import type { OfficerRow, PendingInvitation } from "@/components/admin/officer-invites";
import type { ManagedOfficer } from "@/components/admin/officer-management";

/**
 * Reads for the cooperative-admin screens. Every one is scoped by the same RLS the employee side
 * uses, `is_active_staff(cooperative_id)`, so these queries return this cooperative's rows
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
 * only their ratios: no cooperative is named and nothing private is involved. Returns null when
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

/**
 * `cooperative_staff_roles` holds two foreign keys into `users`, `user_id` and `granted_by`,
 * so an unqualified `users(...)` embed is ambiguous and PostgREST refuses the whole request.
 * The refusal arrives as an error with `data` null, which a `data ?? []` turns into "this
 * cooperative has no officers": a wrong answer that looks exactly like a right one. Both are
 * fixed here: the embed names its foreign key, and a query error is thrown rather than shown
 * as an empty list.
 */
export async function loadOfficers(cooperativeId: string): Promise<OfficerRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cooperative_staff_roles")
    .select("id, status, title, permissions, users!cooperative_staff_roles_user_id_fkey(name, email)")
    .eq("cooperative_id", cooperativeId)
    .eq("role", "officer")
    .neq("status", "revoked")
    .order("invited_at", { ascending: true });

  if (error) throw new Error(`Could not read this cooperative's officers: ${error.message}`);

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
        `${product.name}, save ${Math.round(product.minSavingsRatio * 100)}% first, repay over up to ${product.maxTenureMonths} months`,
    );
}

/**
 * The same officers, carrying their full permission set (blueprint 7.2)'s panel needs every flag
 * rather than the single "can approve" summary the invite list shows.
 */
export async function loadManagedOfficers(cooperativeId: string): Promise<ManagedOfficer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cooperative_staff_roles")
    .select("id, status, title, permissions, users!cooperative_staff_roles_user_id_fkey(name, email)")
    .eq("cooperative_id", cooperativeId)
    .eq("role", "officer")
    .neq("status", "revoked")
    .order("invited_at", { ascending: true });

  if (error) throw new Error(`Could not read this cooperative's officers: ${error.message}`);

  return (data ?? []).map((row) => {
    const person = Array.isArray(row.users) ? row.users[0] : row.users;

    return {
      id: row.id,
      name: person?.name ?? null,
      email: person?.email ?? null,
      title: row.title,
      status: row.status === "active" ? "active" : "invited",
      permissions: readPermissions(row.permissions),
    };
  });
}
