import { createClient, getRequestUser } from "@/lib/supabase/server";
import type { OnboardingState } from "@/lib/onboarding";

export type OnboardingContext = {
  userId: string;
  name: string | null;
  organization: {
    id: string;
    name: string;
    employeeIdLabel: string;
    employeeIdPattern: string;
  };
  state: OnboardingState;
};

/**
 * Everything an onboarding screen needs about the signed-in employee, in one round trip.
 *
 * Returns null when nobody is signed in, so each page can redirect rather than render a shell
 * around nothing. Every read here goes through RLS on the anon key: an employee sees their own
 * row because the policy allows it, not because the query filters for it.
 */
export async function loadOnboardingContext(): Promise<OnboardingContext | null> {
  const supabase = await createClient();

  const user = await getRequestUser();

  if (!user) return null;

  const [{ data: profile }, { data: documents }, { data: memberships }] = await Promise.all([
    supabase
      .from("users")
      .select(
        "name, employee_id, salary_gross, salary_net, salary_verified_at, organization_id, organizations(id, name, employee_id_label, employee_id_pattern)",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("documents").select("id").eq("user_id", user.id).limit(1),
    supabase.from("cooperative_memberships").select("id").eq("user_id", user.id).limit(1),
  ]);

  if (!profile || !profile.organizations) return null;

  const organization = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  return {
    userId: user.id,
    name: profile.name,
    organization: {
      id: organization.id,
      name: organization.name,
      employeeIdLabel: organization.employee_id_label,
      employeeIdPattern: organization.employee_id_pattern,
    },
    state: {
      employeeId: profile.employee_id,
      hasUploadedPayslip: (documents?.length ?? 0) > 0,
      salaryConfirmed: Boolean(profile.salary_verified_at),
      hasMembership: (memberships?.length ?? 0) > 0,
    },
  };
}
