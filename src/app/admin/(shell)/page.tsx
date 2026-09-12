import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { cn } from "@/lib/utils";
import { loadSetupState, loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import { ADMIN_SETUP_STEPS } from "@/lib/admin-setup";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cooperative home" };

/**
 * The first arrival on the Cooperative Dashboard — admin blueprint 4.1.
 *
 * **The dashboard itself belongs to the next block of work and is not built.** What stands here
 * is the part 4.1 owes the setup sequence: the "gently prompts them to finish the remaining setup
 * steps" behaviour that blueprint 2.1 promises anyone who skips, and an honest sentence about
 * what will fill this screen. It does not imitate the dashboard — a grid of zeroes where the
 * cooperative's real figures will go would be worse than saying plainly that they are coming.
 *
 * The PWA install prompt lives here (blueprint 1.3), reusing the employee mechanic unchanged:
 * one dismissible banner, on the screen an admin returns to, after they have seen real value.
 */
export default async function AdminHomePage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  const setup = await loadSetupState(role.cooperativeId);

  const done: Record<string, boolean> = {
    profile: setup?.hasProfile ?? false,
    products: (setup?.productCount ?? 0) > 0,
    import: (setup?.rosterCount ?? 0) > 0,
    officers: (setup?.officerCount ?? 0) > 0,
  };

  const remaining = ADMIN_SETUP_STEPS.filter((step) => !done[step.slug]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8 md:px-8 md:py-10">
      <InstallPrompt />

      <header className="mt-6">
        <p className="type-caption uppercase tracking-[0.08em] text-text-muted">Managing</p>
        <h1 className="type-page-title mt-1 text-text">{role.cooperativeName}</h1>
        <p className="type-secondary mt-2 text-text-secondary">
          {role.role === "admin" ? "Cooperative admin" : (role.title ?? "Cooperative officer")}
        </p>
      </header>

      {remaining.length > 0 ? (
        <section className="mt-10 rounded-feature border border-border bg-surface p-6 md:p-8">
          <h2 className="type-section text-text">
            {remaining.length === ADMIN_SETUP_STEPS.length
              ? "Set your cooperative up"
              : `${remaining.length} ${remaining.length === 1 ? "step" : "steps"} left`}
          </h2>
          <p className="type-body mt-2 max-w-[560px] text-text-secondary">
            Nothing here is blocking: the cooperative exists, and you can work through these in any
            order, at any time.
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

          <Button className="mt-6" render={<Link href={remaining[0].href} />}>
            {remaining.length === ADMIN_SETUP_STEPS.length ? "Start setting up" : "Carry on"}
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>
        </section>
      ) : null}

      <section className="mt-10 rounded-feature border border-border bg-surface px-6 py-10 text-center md:px-10">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
        >
          <LayoutDashboard className="size-5" strokeWidth={1.75} />
        </span>

        <h2 className="type-section mt-6 text-text">The dashboard is the next thing built</h2>

        <p className="type-body mx-auto mt-3 max-w-[460px] text-text-secondary">
          Total savings held, loans out, applications waiting on a decision, and this month&apos;s
          deduction schedule — drawn from your own records, in the same meter-and-figure language
          your members see. None of it is here yet, and a screen of zeroes standing in for it
          would tell you less than this sentence does.
        </p>
      </section>
    </div>
  );
}
