import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CooperativeDashboard } from "@/components/admin/cooperative-dashboard";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { cn } from "@/lib/utils";
import { loadSetupState, loadStaffContext } from "@/lib/supabase/staff-context";
import { loadCooperativeSummary } from "@/lib/supabase/admin-members";
import { preferredRole } from "@/lib/staff";
import { ADMIN_SETUP_STEPS } from "@/lib/admin-setup";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cooperative home" };

/**
 * Cooperative Dashboard — admin blueprint 4.1.
 *
 * The screen an admin returns to constantly: four figures about the cooperative, what is waiting
 * on a decision, and a short read on the month. The setup checklist stays above it until setup is
 * finished, which is what blueprint 2.1 promises anyone who skipped it — a dashboard that
 * "gently prompts them to finish the remaining setup steps rather than blocking entry".
 *
 * The PWA install prompt lives here (blueprint 1.3), reusing the employee mechanic unchanged.
 */
export default async function AdminHomePage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const [setup, summary] = await Promise.all([
    loadSetupState(role.cooperativeId),
    loadCooperativeSummary(role.cooperativeId),
  ]);

  const done: Record<string, boolean> = {
    profile: setup?.hasProfile ?? false,
    products: (setup?.productCount ?? 0) > 0,
    import: (setup?.rosterCount ?? 0) > 0,
    officers: (setup?.officerCount ?? 0) > 0,
  };

  const remaining = ADMIN_SETUP_STEPS.filter((step) => !done[step.slug]);

  return (
    <>
      <div className="mx-auto w-full max-w-[1100px] px-5 pt-8 md:px-8 md:pt-10">
        <InstallPrompt />
      </div>

      {remaining.length > 0 ? (
        <section className="mx-auto w-full max-w-[1100px] px-5 pt-6 md:px-8">
          <div className="rounded-feature border border-border bg-surface p-6 md:p-8">
            <h2 className="type-section text-text">
              {remaining.length === ADMIN_SETUP_STEPS.length
                ? "Set your cooperative up"
                : `${remaining.length} setup ${remaining.length === 1 ? "step" : "steps"} left`}
            </h2>
            <p className="type-body mt-2 max-w-[560px] text-text-secondary">
              Nothing here is blocking: the cooperative exists, and you can work through these in
              any order, at any time.
            </p>

            <ul className="mt-6 divide-y divide-border rounded-card border border-border">
              {ADMIN_SETUP_STEPS.map((step) => (
                <li key={step.slug}>
                  <Link
                    href={step.href}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-background focus-visible:outline-2 focus-visible:outline-indigo focus-visible:-outline-offset-2"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border",
                        done[step.slug]
                          ? "border-emerald/40 text-emerald"
                          : "border-border text-text-muted",
                      )}
                      style={
                        done[step.slug]
                          ? {
                              backgroundColor:
                                "color-mix(in srgb, var(--clarix-brand-accent) 12%, transparent)",
                            }
                          : undefined
                      }
                    >
                      {done[step.slug] ? <Check className="size-4" strokeWidth={3} /> : null}
                    </span>

                    <span
                      className={cn(
                        "flex-1 type-body",
                        done[step.slug] ? "text-text-secondary" : "text-text",
                      )}
                    >
                      {step.label}
                    </span>

                    {done[step.slug] ? (
                      <span className="type-caption text-text-muted">Done</span>
                    ) : (
                      <ArrowRight aria-hidden strokeWidth={2} className="size-4 text-text-muted" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <Button className="mt-6" size="sm" render={<Link href={remaining[0].href} />}>
              {remaining.length === ADMIN_SETUP_STEPS.length ? "Start setting up" : "Carry on"}
              <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
            </Button>
          </div>
        </section>
      ) : null}

      <CooperativeDashboard
        cooperativeName={role.cooperativeName}
        summary={summary}
        firstName={staff?.name?.split(" ")[0] ?? null}
      />
    </>
  );
}
