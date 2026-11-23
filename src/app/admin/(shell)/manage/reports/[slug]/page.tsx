import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportChart } from "@/components/admin/report-chart";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";
import {
  loadMemberGrowth,
  loadSavingsHeld,
  loadShortfallTrend,
} from "@/lib/supabase/reports-data";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

const TITLES: Record<string, string> = {
  "member-growth": "Member growth",
  "savings-held": "Total savings held",
  shortfall: "Deduction shortfall",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: TITLES[slug] ?? "Report" };
}

/**
 * One report: chart, then table (admin blueprint 7.6).
 *
 * The table is not a fallback for the chart, it is the report. The chart says which way something
 * has gone; the figures underneath are what an admin reads to their committee, which is why each
 * one carries the exact numbers rather than rounding for display.
 *
 * Where a report has nothing to show, it says why in terms of what has not happened yet, rather
 * than drawing an empty axis and letting it read as a flat trend.
 */
export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!TITLES[slug]) notFound();

  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");
  if (!role.permissions.can_view_members) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-8 md:px-8 md:py-10">
      <Button variant="tertiary" className="-ml-3" render={<Link href="/admin/manage/reports" />}>
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        Reports
      </Button>

      <h1 className="type-page-title mt-6 text-text">{TITLES[slug]}</h1>

      {slug === "member-growth" ? <MemberGrowth cooperativeId={role.cooperativeId} /> : null}
      {slug === "savings-held" ? <SavingsHeld cooperativeId={role.cooperativeId} /> : null}
      {slug === "shortfall" ? <Shortfall cooperativeId={role.cooperativeId} /> : null}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-feature border border-border bg-surface px-6 py-8">
      <p className="type-body max-w-[520px] text-text-secondary">{children}</p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-feature border border-border bg-surface p-5 md:p-6">
      {children}
    </div>
  );
}

async function MemberGrowth({ cooperativeId }: { cooperativeId: string }) {
  const { joinedPerMonth, runningTotal, total } = await loadMemberGrowth(cooperativeId);

  if (runningTotal.length === 0) {
    return (
      <Empty>
        Nobody has joined yet, so there is no growth to plot. This fills in as members accept their
        place at your cooperative.
      </Empty>
    );
  }

  return (
    <>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        {total} active {total === 1 ? "member" : "members"}, counted from the month each of them
        joined.
      </p>

      <Panel>
        <ReportChart
          points={runningTotal.map((point) => ({ label: point.label, value: point.value }))}
          format="members"
        />
      </Panel>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="type-caption pb-3 font-normal uppercase tracking-[0.08em] text-text-muted">
                Month
              </th>
              <th className="type-caption pb-3 text-right font-normal uppercase tracking-[0.08em] text-text-muted">
                Joined
              </th>
              <th className="type-caption pb-3 text-right font-normal uppercase tracking-[0.08em] text-text-muted">
                Members
              </th>
            </tr>
          </thead>
          <tbody>
            {joinedPerMonth.map((row, index) => (
              <tr key={row.month} className="border-b border-border last:border-0">
                <td className="type-secondary py-3 text-text">{row.label}</td>
                <td className="type-secondary tabular py-3 text-right text-text-secondary">
                  {row.value > 0 ? `+${row.value}` : "None"}
                </td>
                <td className="type-secondary tabular py-3 text-right text-text">
                  {runningTotal[index].value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function SavingsHeld({ cooperativeId }: { cooperativeId: string }) {
  const { series, held, contributions, withdrawals } = await loadSavingsHeld(cooperativeId);

  if (series.length === 0) {
    return (
      <Empty>
        No contributions or withdrawals have been recorded yet, so there is no balance to plot over
        time. This fills in as entries are recorded against your members.
      </Empty>
    );
  }

  return (
    <>
      <p className="type-body mt-3 max-w-[600px] text-text-secondary">
        {formatNaira(held)} held today, from {formatNaira(contributions)} contributed less{" "}
        {formatNaira(withdrawals)} withdrawn. Loan repayments are not counted here: they pay down a
        loan rather than adding to savings.
      </p>

      <Panel>
        <ReportChart
          points={series.map((point) => ({ label: point.label, value: point.value }))}
          format="naira"
        />
      </Panel>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="type-caption pb-3 font-normal uppercase tracking-[0.08em] text-text-muted">
                Month
              </th>
              <th className="type-caption pb-3 text-right font-normal uppercase tracking-[0.08em] text-text-muted">
                Held at month end
              </th>
              <th className="type-caption pb-3 text-right font-normal uppercase tracking-[0.08em] text-text-muted">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((row, index) => {
              const change = index === 0 ? row.value : row.value - series[index - 1].value;

              return (
                <tr key={row.month} className="border-b border-border last:border-0">
                  <td className="type-secondary py-3 text-text">{row.label}</td>
                  <td className="type-secondary tabular py-3 text-right text-text">
                    {formatNaira(row.value)}
                  </td>
                  <td className="type-secondary tabular py-3 text-right text-text-secondary">
                    {change === 0
                      ? "No change"
                      : `${change > 0 ? "+" : "-"}${formatNaira(Math.abs(change))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

async function Shortfall({ cooperativeId }: { cooperativeId: string }) {
  const rows = await loadShortfallTrend(cooperativeId);

  if (rows.length === 0) {
    return (
      <Empty>
        Nothing has been reconciled yet, so there is no shortfall to show. This report fills itself
        in from the Reconciliation screen: once a month is entered there with what payroll actually
        sent, it appears here against what was expected. An empty chart would imply payroll sent
        nothing, which is a different claim entirely.
      </Empty>
    );
  }

  const expected = rows.reduce((total, row) => total + row.expected, 0);
  const received = rows.reduce((total, row) => total + row.received, 0);

  return (
    <>
      <p className="type-body mt-3 max-w-[600px] text-text-secondary">
        Across {rows.length} reconciled {rows.length === 1 ? "month" : "months"},{" "}
        {formatNaira(expected)} was expected and {formatNaira(received)} arrived.
      </p>

      <Panel>
        <ReportChart
          tone="indigo"
          points={rows.map((row) => ({ label: row.label, value: row.shortfall }))}
          format="naira"
        />
      </Panel>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="type-caption pb-3 font-normal uppercase tracking-[0.08em] text-text-muted">
                Month
              </th>
              <th className="type-caption pb-3 text-right font-normal uppercase tracking-[0.08em] text-text-muted">
                Expected
              </th>
              <th className="type-caption pb-3 text-right font-normal uppercase tracking-[0.08em] text-text-muted">
                Received
              </th>
              <th className="type-caption pb-3 text-right font-normal uppercase tracking-[0.08em] text-text-muted">
                Short by
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.period} className="border-b border-border last:border-0">
                <td className="type-secondary py-3 text-text">{row.label}</td>
                <td className="type-secondary tabular py-3 text-right text-text-secondary">
                  {formatNaira(row.expected)}
                </td>
                <td className="type-secondary tabular py-3 text-right text-text-secondary">
                  {formatNaira(row.received)}
                </td>
                <td
                  className={`type-secondary tabular py-3 text-right ${
                    row.shortfall > 0 ? "text-warning" : "text-text"
                  }`}
                >
                  {row.shortfall > 0 ? formatNaira(row.shortfall) : "Nothing"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
