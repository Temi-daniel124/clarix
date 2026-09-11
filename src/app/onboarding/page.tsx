import { redirect } from "next/navigation";
import { loadOnboardingContext } from "@/lib/supabase/onboarding-state";
import { nextOnboardingStep } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

/**
 * /onboarding is a router, not a screen: it sends the employee to whichever step their record
 * says is outstanding. A brand-new account goes to the Welcome Tour first (blueprint 2.1);
 * anyone returning mid-sequence skips it and resumes where they stopped.
 */
export default async function OnboardingIndex() {
  const context = await loadOnboardingContext();
  if (!context) redirect("/login");

  const { state } = context;
  const untouched = !state.employeeId && !state.hasUploadedPayslip && !state.salaryConfirmed;

  if (untouched) redirect("/onboarding/welcome");

  redirect(`/onboarding/${nextOnboardingStep(state)}`);
}
