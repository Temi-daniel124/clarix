import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdentityMark } from "@/components/clarix/identity-mark";
import { KpiCards } from "@/components/clarix/kpi-cards";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { loadDashboardData } from "@/lib/supabase/dashboard-data";
import { InsightsStrip } from "./insights-strip";
import { JoinPrompt } from "./join-prompt";
import { formatDayMonthTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Home" };

/**
 * Dashboard (blueprint 4.1) (also referenced as 6.1).
 *
 * The screen an employee returns to most often: one honest snapshot of where they stand across
 * every cooperative, in the order the blueprint sets out, greeting, KPI row, freshness line,
 * Insights strip, and a quiet prompt to browse Discovery if they have joined fewer cooperatives
 * than exist.
 *
 * The hierarchy is deliberate rather than a flat stack: an identity block at the top that says
 * whose figures these are, then the KPI group under its own heading with the freshness line
 * attached to it, then Insights. Without that grouping the screen read as four bare numbers on
 * an empty page.
 *
 * There is no refresh control. Figures are current as of the last confirmed record, and the
 * timestamp says when that was, rather than implying a live payroll connection that does not
 * exist (DECISIONS.md D005).
 */
export default async function DashboardPage() {
  const data = await loadDashboardData();
  if (!data) redirect("/login");

  // An account that has not confirmed a salary cannot be shown a capacity figure at all, so send
  // it back to finish onboarding rather than rendering a dashboard full of zeroes.
  if (!data.salaryConfirmed) redirect("/onboarding");

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8 md:px-8 md:py-10">
      <InstallPrompt />

      <header className="mt-6 flex items-center gap-4">
        <IdentityMark name={data.firstName} className="size-12 shrink-0 md:size-14" />

        <div className="min-w-0">
          <h1 className="type-page-title text-text">
            {greeting()}
            {data.firstName ? `, ${data.firstName}` : ""}.
          </h1>
          <p className="type-secondary mt-1 truncate text-text-secondary">
            {data.organizationName}
            {data.employeeId ? ` · ${data.employeeId}` : ""}
          </p>
        </div>
      </header>

      <section
        className="mt-10 rounded-feature border border-border bg-background p-4 md:p-5"
        aria-labelledby="position-heading"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1 pb-4">
          <h2
            id="position-heading"
            className="type-caption uppercase tracking-[0.08em] text-text-muted"
          >
            Across every cooperative
          </h2>

          {data.lastUpdated ? (
            <p className="flex items-center gap-1.5 type-caption text-text-muted">
              <Clock aria-hidden strokeWidth={1.75} className="size-3.5" />
              Current as of {formatUpdated(data.lastUpdated)}
            </p>
          ) : null}
        </div>

        <KpiCards
          totalSavings={data.totalSavings}
          activeLoanCount={data.activeLoanCount}
          monthlyDeductions={data.monthlyDeductions}
          capacity={data.capacity}
          salaryConfirmed={data.salaryConfirmed}
          savingsTrend={data.savingsTrend}
        />
      </section>

      <InsightsStrip insights={data.insights} />

      {data.cooperatives.length === 0 ? (
        <section className="mt-10 rounded-feature border border-border bg-surface p-8">
          <h2 className="type-section text-text">You have not joined a cooperative yet</h2>
          <p className="type-body mt-2 max-w-[520px] text-text-secondary">
            Clarix works out your combined deductions across the cooperatives you belong to, so
            there is nothing to add up until you join at least one.
          </p>
          <Button className="mt-6" render={<Link href="/cooperatives/discover" />}>
            Browse cooperatives
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>
        </section>
      ) : (
        <JoinPrompt unjoinedCount={data.unjoinedCount} />
      )}
    </div>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatUpdated(iso: string): string {
  return formatDayMonthTime(iso);
}
