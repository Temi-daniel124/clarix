import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeterBar } from "@/components/clarix/meter-bar";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { StatusPill, formatDate } from "@/components/clarix/loan-card";
import { formatNaira } from "@/lib/format";
import { loadLedger, loadLoans } from "@/lib/supabase/loans-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loan" };

/**
 * Loan Detail (blueprint 5.3).
 *
 * Scoped to a single cooperative, because loans are never combined across cooperatives in the
 * employee's own detailed view. Only the aggregate capacity figure crosses that line.
 *
 * Read-only from the employee's side: repayments are recorded by cooperative staff, never
 * initiated here, because Clarix is not a payment system (DECISIONS.md D004). There are
 * deliberately no action buttons beyond navigation.
 */
export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const loans = await loadLoans();
  const loan = loans.find((entry) => entry.id === id);
  if (!loan) notFound();

  const ledger = await loadLedger(loan.membershipId);
  const repayments = ledger.filter((entry) => entry.loanId === loan.id);

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-8 md:px-8 md:py-10">
      <Button
        variant="tertiary"
        className="-ml-3"
        render={<Link href={`/cooperatives/${loan.cooperativeId}`} />}
      >
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        {loan.cooperativeName}
      </Button>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
          {loan.status === "completed" ? "Originally borrowed" : "Remaining balance"}
        </p>
        <StatusPill status={loan.status} />
      </div>

      <div className="mt-2">
        <RollingNumber
          value={loan.status === "completed" ? loan.requestedAmount : loan.remaining}
          className="type-kpi text-text"
        />
      </div>

      <p className="type-secondary mt-1 tabular text-text-muted">
        of {formatNaira(loan.requestedAmount)} borrowed over {loan.tenureMonths} months
      </p>

      {loan.status === "active" || loan.status === "completed" ? (
        <section className="mt-6">
          <MeterBar
            usedRatio={loan.progress}
            track="neutral"
            label={`${Math.round(loan.progress * 100)}% of this loan repaid`}
          />
          <p className="type-caption mt-2 text-text-secondary">
            {Math.round(loan.progress * 100)}% repaid · {formatNaira(loan.repaid)} of{" "}
            {formatNaira(loan.requestedAmount)}
          </p>
        </section>
      ) : null}

      {loan.status === "pending_review" ? (
        <p
          className="mt-6 flex items-start gap-3 rounded-card border border-warning/30 px-4 py-3 type-secondary text-warning"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-warning) 8%, transparent)" }}
        >
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          Sent to {loan.cooperativeName}. It is above your limit, so nothing is held for you. The
          cooperative will decide.
        </p>
      ) : null}

      {loan.status === "reserved" && loan.reservationExpiresAt ? (
        <p
          className="mt-6 flex items-start gap-3 rounded-card border border-warning/30 px-4 py-3 type-secondary text-warning"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-warning) 8%, transparent)" }}
        >
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {formatNaira(loan.monthlyRepayment)} a month is held against your limit while{" "}
          {loan.cooperativeName} reviews this. The hold lapses on{" "}
          {formatDate(loan.reservationExpiresAt)} if they have not decided by then.
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-feature border border-border bg-surface p-5">
        <div>
          <dt className="type-caption text-text-muted">Monthly repayment</dt>
          <dd className="type-card-title tabular mt-1 text-text">
            {formatNaira(loan.monthlyRepayment)}
          </dd>
        </div>
        <div>
          <dt className="type-caption text-text-muted">
            {loan.status === "active" ? "Next deduction expected" : "Status"}
          </dt>
          <dd className="type-card-title mt-1 text-text">
            {loan.status === "active" && loan.nextRepaymentOn
              ? formatDate(loan.nextRepaymentOn)
              : loan.completedAt
                ? `Settled ${formatDate(loan.completedAt)}`
                : "Not scheduled"}
          </dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="type-section text-text">Repayment history</h2>

        {repayments.length === 0 ? (
          <p className="type-body mt-3 text-text-secondary">
            No repayments recorded yet. Each one appears here after {loan.cooperativeName} records
            the deduction. Clarix has no payroll connection of its own, so it only knows what
            they enter.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-feature border border-border bg-surface">
            {repayments.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="type-body text-text">{entry.description ?? "Repayment"}</p>
                  <p className="type-caption mt-1 text-text-muted">
                    {formatDate(entry.recordedAt)}
                  </p>
                </div>
                <span className="type-card-title tabular shrink-0 text-text">
                  {formatNaira(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
