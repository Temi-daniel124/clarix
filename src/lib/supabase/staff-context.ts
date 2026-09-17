import { createClient } from "@/lib/supabase/server";
import { effectivePermissions, type StaffRole } from "@/lib/staff";

/**
 * Everything an admin/officer screen needs about the signed-in person's relationship to a
 * cooperative, in one round trip.
 *
 * The query carries no `user_id` filter. `cooperative_staff_roles_select_own` is what scopes it,
 * the same way every other read in this product is scoped: the screen is not the boundary
 * (SECURITY.md).
 */

export type StaffContext = {
  userId: string;
  name: string | null;
  email: string | null;
  roles: StaffRole[];
  /**
   * Whether this account operates the platform itself (super-admin blueprint 1.1). It is a flag
   * on `platform_admins`, not a cooperative-scoped role, which is why it sits beside `roles`
   * rather than inside them, and it deliberately grants no access to any cooperative's member
   * data (ROLES-AND-PERMISSIONS.md).
   */
  isPlatformAdmin: boolean;
};

export async function loadStaffContext(): Promise<StaffContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: rows }, { data: platform }] = await Promise.all([
    supabase.from("users").select("name, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("cooperative_staff_roles")
      .select("id, cooperative_id, role, status, title, permissions, cooperatives(name)")
      .eq("user_id", user.id)
      .neq("status", "revoked"),
    // `platform_admins_select_own` scopes this to the caller's own row, so the query carries no
    // filter of its own and can never see anybody else's.
    supabase.from("platform_admins").select("user_id").maybeSingle(),
  ]);

  const roles: StaffRole[] = (rows ?? []).map((row) => {
    const cooperative = Array.isArray(row.cooperatives) ? row.cooperatives[0] : row.cooperatives;
    const permissions = effectivePermissions(row.role, row.permissions);

    return {
      id: row.id,
      cooperativeId: row.cooperative_id,
      cooperativeName: cooperative?.name ?? "This cooperative",
      role: row.role,
      status: row.status,
      title: row.title,
      canApproveLoans: permissions.can_approve_loans,
      permissions,
    };
  });

  return {
    userId: user.id,
    name: profile?.name ?? null,
    email: profile?.email ?? user.email ?? null,
    roles,
    isPlatformAdmin: Boolean(platform),
  };
}

/**
 * How far through the setup sequence (blueprint 2.2–2.5) a cooperative actually is.
 *
 * Derived from the cooperative's own records rather than stored as a cursor, for the same reason
 * employee onboarding derives its step: a stored pointer can disagree with what is really there,
 * and an admin who sets something up in a different order should not be told to do it again.
 */
export type SetupState = {
  cooperativeId: string;
  cooperativeName: string;
  hasProfile: boolean;
  productCount: number;
  rosterCount: number;
  officerCount: number;
  complete: boolean;
};

export async function loadSetupState(cooperativeId: string): Promise<SetupState | null> {
  const supabase = await createClient();

  const [{ data: cooperative }, products, roster, officers] = await Promise.all([
    supabase
      .from("cooperatives")
      .select("id, name, description, requirements")
      .eq("id", cooperativeId)
      .maybeSingle(),
    supabase
      .from("cooperative_loan_products")
      .select("id", { count: "exact", head: true })
      .eq("cooperative_id", cooperativeId),
    supabase
      .from("member_roster_entries")
      .select("id", { count: "exact", head: true })
      .eq("cooperative_id", cooperativeId),
    supabase
      .from("cooperative_staff_roles")
      .select("id", { count: "exact", head: true })
      .eq("cooperative_id", cooperativeId)
      .eq("role", "officer"),
  ]);

  if (!cooperative) return null;

  const hasProfile = Boolean(cooperative.description?.trim());
  const productCount = products.count ?? 0;
  const rosterCount = roster.count ?? 0;
  const officerCount = officers.count ?? 0;

  return {
    cooperativeId: cooperative.id,
    cooperativeName: cooperative.name,
    hasProfile,
    productCount,
    rosterCount,
    officerCount,
    // Officers are explicitly optional in the blueprint ("skippable and unpenalized"), so they
    // are not part of what counts as set up.
    complete: hasProfile && productCount > 0 && rosterCount > 0,
  };
}
