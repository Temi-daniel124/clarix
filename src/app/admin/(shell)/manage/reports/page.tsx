import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, TrendingUp, PiggyBank, Scale } from "lucide-react";
import { loadStaffContext } from "@/lib/supabase/staff-context";
import { preferredRole } from "@/lib/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports" };

/**
 * Reports (admin blueprint 7.6).
 *
 * The blueprint names three views and nothing else: "member growth over time, total savings held,
 * reconciliation shortfall trend", each "a simple chart-plus-table page rather than a configurable
 * report-builder". This is that list, exactly. No date-range picker, no grouping, no export, all
 * of which the blueprint calls reasonable later additions rather than part of this.
 */
const REPORTS = [
  {
    slug: "member-growth",
    title: "Member growth",
    body: "How many people joined each month, and how the membership has added up over time.",
    icon: TrendingUp,
  },
  {
    slug: "savings-held",
    title: "Total savings held",
    body: "What your members have saved with you, month by month, built from the ledger rather than from today's balance.",
    icon: PiggyBank,
  },
  {
    slug: "shortfall",
    title: "Deduction shortfall",
    body: "What payroll was expected to deduct against what actually arrived, for the months you have reconciled.",
    icon: Scale,
  },
] as const;

export default async function ReportsPage() {
  const staff = await loadStaffContext();
  const role = staff ? preferredRole(staff.roles) : null;
  if (!role) redirect("/login");

  // Every figure on these pages is an arrangement of member and ledger rows, which is what
  // `can_view_members` governs. An officer without it would otherwise see three empty charts,
  // which reads as a broken screen rather than as a boundary.
  if (!role.permissions.can_view_members) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Reports</h1>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Three views of {role.cooperativeName}, each reading the same records your members and loans
        screens do. Nothing here is a separate set of books.
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        {REPORTS.map((report) => (
          <li key={report.slug}>
            <Link
              href={`/admin/manage/reports/${report.slug}`}
              className="flex items-start gap-4 rounded-card border border-border bg-surface p-5 transition-colors duration-150 hover:border-text-muted/50 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
              >
                <report.icon className="size-5" strokeWidth={1.75} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block type-card-title text-text">{report.title}</span>
                <span className="mt-1 block type-secondary text-text-secondary">{report.body}</span>
              </span>

              <ArrowRight
                aria-hidden
                strokeWidth={2}
                className="mt-2 size-4 shrink-0 text-text-muted"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
