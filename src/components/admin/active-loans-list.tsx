"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MeterBar } from "@/components/clarix/meter-bar";
import { clampRatio, formatNaira } from "@/lib/format";
import type { LoanSummaryRow } from "@/lib/supabase/admin-loans";

/**
 * Active Loans (admin blueprint 6.3).
 *
 * "Reusing the same list-and-filter shape as Member Search rather than inventing a new pattern
 * for what is structurally the same kind of screen": a persistent search field, a table on
 * desktop, stacked cards on mobile.
 *
 * Progress is drawn with the same meter the rest of the product uses, and it is repayment against
 * the original amount, money that actually arrived, never months elapsed.
 */
export function ActiveLoansList({ loans }: { loans: LoanSummaryRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return loans;
    return loans.filter((loan) => (loan.memberName ?? "").toLowerCase().includes(needle));
  }, [loans, query]);

  if (loans.length === 0) {
    return (
      <div className="rounded-feature border border-border bg-surface px-6 py-10 text-center">
        <span
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
        >
          <Receipt className="size-5" strokeWidth={1.75} />
        </span>
        <p className="type-body mt-5 text-text">No loan is currently being repaid</p>
        <p className="type-secondary mx-auto mt-2 max-w-[420px] text-text-secondary">
          A loan appears here once you approve it, and leaves when it is repaid in full.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search
          aria-hidden
          strokeWidth={2}
          className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4 text-text-muted"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by member name"
          aria-label="Search active loans"
          className="pl-11"
        />
      </div>

      <p className="type-secondary mt-4 text-text-secondary">
        {filtered.length === loans.length
          ? `${loans.length} ${loans.length === 1 ? "loan" : "loans"} outstanding`
          : `${filtered.length} of ${loans.length}`}
      </p>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                Member
              </th>
              <th scope="col" className="pb-3 pr-4 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                Remaining
              </th>
              <th scope="col" className="pb-3 pr-4 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                Monthly
              </th>
              <th scope="col" className="pb-3 type-caption uppercase tracking-[0.08em] text-text-muted">
                Next expected
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((loan) => (
              <tr key={loan.id} className="border-b border-border last:border-b-0">
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/loans/${loan.id}`}
                    className="type-body font-medium text-text underline-offset-4 transition-colors duration-150 hover:text-emerald hover:underline focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
                  >
                    {loan.memberName ?? "Member"}
                  </Link>
                  <div className="mt-2 max-w-[220px]">
                    <MeterBar
                      size="compact"
                      track="neutral"
                      usedRatio={clampRatio(loan.repaid / loan.requestedAmount)}
                      label={`${formatNaira(loan.repaid)} repaid of ${formatNaira(loan.requestedAmount)}`}
                    />
                  </div>
                </td>
                <td className="py-3 pr-4 text-right type-secondary tabular text-text">
                  {formatNaira(loan.remaining)}
                </td>
                <td className="py-3 pr-4 text-right type-secondary tabular text-text-secondary">
                  {formatNaira(loan.monthlyRepayment)}
                </td>
                <td className="py-3 type-secondary text-text-secondary">
                  {loan.nextExpected ? formatDate(loan.nextExpected) : "None due"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 flex flex-col gap-3 md:hidden">
        {filtered.map((loan) => (
          <li key={loan.id}>
            <Link
              href={`/admin/loans/${loan.id}`}
              className="block rounded-card border border-border bg-surface p-4 transition-colors duration-150 hover:border-text-muted/40 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
            >
              <p className="type-card-title text-text">{loan.memberName ?? "Member"}</p>
              <p className="type-secondary mt-1 tabular text-text-secondary">
                {formatNaira(loan.remaining)} left · {formatNaira(loan.monthlyRepayment)} a month
              </p>
              <div className="mt-3">
                <MeterBar
                  size="compact"
                  track="neutral"
                  usedRatio={clampRatio(loan.repaid / loan.requestedAmount)}
                  label={`${formatNaira(loan.repaid)} repaid of ${formatNaira(loan.requestedAmount)}`}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}
