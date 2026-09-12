/**
 * The cooperative-admin setup sequence — admin blueprint 2.1 to 2.5.
 *
 * The employee side keeps its step list in `src/lib/onboarding.ts` for the same reasons, and this
 * is deliberately its sibling rather than a shared abstraction: the two sequences ask for
 * completely different things, and one list with a role flag in it would read as neither.
 *
 * The Welcome tour sits outside the numbered steps, exactly as the employee tour does — it is
 * orientation, not a step with state attached.
 */

export const ADMIN_SETUP_STEPS = [
  { slug: "profile", label: "Cooperative profile", href: "/admin/setup/profile" },
  { slug: "products", label: "Loan products", href: "/admin/setup/products" },
  { slug: "import", label: "Member roster", href: "/admin/setup/import" },
  { slug: "officers", label: "Officers", href: "/admin/setup/officers" },
] as const;

export type AdminSetupSlug = (typeof ADMIN_SETUP_STEPS)[number]["slug"];

export function adminStepIndex(slug: AdminSetupSlug): number {
  return ADMIN_SETUP_STEPS.findIndex((step) => step.slug === slug);
}

/** The screen after this one, or the dashboard when the sequence is done. */
export function nextAdminStepHref(slug: AdminSetupSlug): string {
  const next = ADMIN_SETUP_STEPS[adminStepIndex(slug) + 1];
  return next ? next.href : "/admin";
}
