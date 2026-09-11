import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/clarix/wordmark";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { createClient } from "@/lib/supabase/server";

// Authenticated and cookie-dependent: never prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
};

/**
 * PLACEHOLDER — this route exists so that Log In (blueprint 1.4) lands somewhere honest.
 *
 * The real Dashboard is blueprint 6.1: the KPI row, the expand-to-detail cards, the Clarix
 * Insights strip. None of that is built yet, and none of it can be built truthfully until the
 * onboarding slice (employee ID, payslip, join a cooperative) puts real figures behind it.
 * Replace this file wholesale when 6.1 is built — do not grow it screen-element by
 * screen-element.
 *
 * What it does carry today is the PWA install prompt (blueprint 1.2), which belongs here and
 * explicitly nowhere else: never on the landing page, never during onboarding.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, employee_id, salary_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.name?.split(" ")[0];
  const onboardingDone = Boolean(profile?.employee_id && profile?.salary_verified_at);

  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 px-5 py-10 md:px-8 md:py-16">
      <Wordmark />

      <div className="mt-10">
        <InstallPrompt />
      </div>

      <h1 className="type-page-title mt-10 text-text">
        {firstName ? `Welcome, ${firstName}.` : "Welcome to Clarix."}
      </h1>

      {onboardingDone ? (
        <p className="type-body mt-3 max-w-[560px] text-text-secondary">
          Your account is set up. Your cooperatives, balances and remaining deduction capacity
          appear here once the dashboard itself is built.
        </p>
      ) : (
        <>
          <p className="type-body mt-3 max-w-[560px] text-text-secondary">
            There are three short steps left before Clarix can work out your deduction capacity:
            your IPPIS number, a recent payslip so your salary is confirmed, and the cooperatives
            you belong to.
          </p>

          <Button className="mt-8" render={<Link href="/onboarding" />}>
            Continue setting up
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>
        </>
      )}
    </main>
  );
}
