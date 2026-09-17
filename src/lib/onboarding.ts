/**
 * Employee onboarding: the step sequence and the rule for where a given account belongs.
 *
 * The sequence is the one in docs/planning/clarix-design-system.md § 6: account created, then
 * employee ID, then payslip, then review, then join a cooperative. The Welcome Tour (blueprint
 * 2.1) deliberately sits outside the numbered steps. It is skippable orientation, not a step
 * with state attached.
 *
 * Which step someone lands on is derived from their record rather than stored as a cursor. An
 * employee who abandons onboarding on one device and returns on another resumes in the right
 * place, and a stored pointer can never disagree with what is actually filled in.
 */

export const ONBOARDING_STEPS = [
  { slug: "account", label: "Account created", href: null },
  { slug: "employee-id", label: "Staff ID", href: "/onboarding/employee-id" },
  { slug: "payslip", label: "Payslip", href: "/onboarding/payslip" },
  { slug: "review", label: "Review", href: "/onboarding/review" },
  { slug: "cooperatives", label: "Join a cooperative", href: "/onboarding/cooperatives" },
] as const;

export type OnboardingStepSlug = (typeof ONBOARDING_STEPS)[number]["slug"];

export type OnboardingState = {
  employeeId: string | null;
  hasUploadedPayslip: boolean;
  salaryConfirmed: boolean;
  hasMembership: boolean;
};

/** The step this account should currently be on. */
export function nextOnboardingStep(state: OnboardingState): OnboardingStepSlug {
  if (!state.employeeId) return "employee-id";
  if (!state.hasUploadedPayslip) return "payslip";
  if (!state.salaryConfirmed) return "review";
  if (!state.hasMembership) return "cooperatives";
  return "cooperatives";
}

/** True once there is nothing left to ask for: the dashboard can stand on its own. */
export function isOnboardingComplete(state: OnboardingState): boolean {
  return Boolean(state.employeeId) && state.salaryConfirmed;
}

export function stepIndex(slug: OnboardingStepSlug): number {
  return ONBOARDING_STEPS.findIndex((step) => step.slug === slug);
}

/**
 * Validates a staff ID against the pattern the organization configures
 * (`organizations.employee_id_pattern`; for FMC Abeokuta that is six digits).
 *
 * The pattern is applied rather than hard-coded so a second organization is a row, not a code
 * change, DECISIONS.md D019 keeps the scoping columns even though v1 populates one row.
 */
export function matchesEmployeeIdPattern(value: string, pattern: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    return new RegExp(pattern).test(trimmed);
  } catch {
    // A malformed pattern must not let anything through: fail closed, and let the Super Admin
    // screen that sets it be where a bad pattern surfaces.
    return false;
  }
}

/** Strips anything the pattern would reject anyway, so the field stays tidy as it is typed. */
export function normaliseEmployeeId(value: string): string {
  return value.replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
}
