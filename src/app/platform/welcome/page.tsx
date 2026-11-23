import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/clarix/wordmark";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { landingPathFor } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Welcome to Clarix platform administration" };

/**
 * Welcome to Clarix Platform Administration (super-admin blueprint 2.1).
 *
 * One screen, one button, no slides. The blueprint is explicit that this role belongs to the
 * platform's own operator, "who already understands the product deeply, so an extended
 * orientation would be patronizing rather than helpful".
 *
 * Its only job is the boundary. Everything else about this role can be discovered by using it;
 * the thing that cannot safely be discovered late is that administrative power here does not come
 * with visibility into anybody's money, and that reaching that data is a deliberate, logged,
 * expiring act rather than a click.
 */
export default async function PlatformWelcomePage() {
  const staff = await loadStaffContext();
  if (!staff) redirect("/login");
  if (!staff.isPlatformAdmin) redirect(landingPathFor(staff.roles));

  return (
    <div className="flex min-h-app flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-[640px] items-center justify-between px-5 py-6 md:px-8">
        <Wordmark />
      </header>

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center px-5 pb-20 md:px-8">
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-card border border-border text-text-secondary"
        >
          <ShieldCheck className="size-6" strokeWidth={1.75} />
        </span>

        <h1 className="type-page-title mt-8 max-w-[520px] text-text">
          You&rsquo;re set up to run the Clarix platform
        </h1>

        <div className="mt-5 flex max-w-[540px] flex-col gap-4">
          <p className="type-body text-text-secondary">
            This account creates and manages cooperative accounts, sets the deduction policy every
            cooperative at FMC Abeokuta inherits, and oversees what happens on the platform.
          </p>

          <p className="type-body text-text-secondary">
            It cannot see any member&rsquo;s savings, loans or salary, and that is deliberate
            rather than unfinished. Reaching that data takes an explicit access request, naming
            the cooperative and the reason, which the cooperative&rsquo;s own admin is told about,
            which expires on its own, and every screen viewed under it is logged.
          </p>
        </div>

        <Button className="mt-10 self-start" render={<Link href="/platform" />}>
          Continue
          <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
        </Button>
      </main>
    </div>
  );
}
