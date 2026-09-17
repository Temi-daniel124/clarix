import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoanCard, formatDate } from "@/components/clarix/loan-card";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { formatNaira } from "@/lib/format";
import { loadLedger, loadLoans } from "@/lib/supabase/loans-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cooperative" };

/**
 * Cooperative Detail (blueprint 5.1).
 *
 * "How am I doing here": the two headline figures side by side, a loan summary that acts as an
 * entry point rather than duplicating Loan Detail, the quick actions, and a reverse-chronological
 * activity list.
 *
 * The activity list is read-only. Employees view their history here and never edit it, which is
 * what Clarix recording rather than executing transactions means in practice.
 */
export default async function CooperativeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("cooperative_memberships")
    .select("id, status, savings_balance, joined_at, cooperative_id, cooperatives(name, description)")
    .eq("user_id", user.id)
    .eq("cooperative_id", id)
    .maybeSingle();

  // Not a member: the public profile is the right screen, not this one.
  if (!membership) redirect(`/cooperatives/discover/${id}`);

  const cooperative = Array.isArray(membership.cooperatives)
    ? membership.cooperatives[0]
    : membership.cooperatives;
  if (!cooperative) notFound();

  const [loans, ledger] = await Promise.all([loadLoans(), loadLedger(membership.id)]);
  const here = loans.filter((loan) => loan.membershipId === membership.id);

  // Both an active loan and a pending application can exist here at once, and showing only the
  // most recent hid the active one behind a new reservation. Active first, because "how am I
  // doing here" is answered by what is actually being deducted.
  const openLoans = here
    .filter((loan) => loan.status === "active" || loan.status === "reserved")
    .sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1));
  const activeLoan = openLoans.find((loan) => loan.status === "active");
  const loanBalance = here
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remaining, 0);

  const monthlyContribution = ledger.find((entry) => entry.type === "contribution")?.amount ?? null;

  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-8 md:px-8 md:py-10">
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/cooperatives" />}>
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        My cooperatives
      </Button>

      <h1 className="type-page-title mt-6 text-text">{cooperative.name}</h1>
      {membership.status !== "active" ? (
        <p className="type-secondary mt-2 text-warning">
          Your membership here is still {membership.status}.
        </p>
      ) : membership.joined_at ? (
        <p className="type-secondary mt-2 text-text-secondary">
          A member since {formatDate(membership.joined_at)}.
        </p>
      ) : null}

      {/* The two headline figures. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
            Savings balance
          </p>
          <div className="mt-2">
            <RollingNumber
              value={Number(membership.savings_balance ?? 0)}
              className="type-kpi text-text"
            />
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <p className="type-caption uppercase tracking-[0.08em] text-text-muted">Loan balance</p>
          <div className="mt-2">
            <RollingNumber value={loanBalance} className="type-kpi text-text" />
          </div>
        </div>
      </div>

      {monthlyContribution ? (
        <p className="type-secondary mt-3 text-text-secondary">
          Monthly contribution: {formatNaira(monthlyContribution)}, as last recorded.
        </p>
      ) : null}

      {/* A loan summary that leads onward rather than repeating Loan Detail. */}
      {openLoans.length > 0 ? (
        <section className="mt-8">
          <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">
            {openLoans.length === 1 ? "Your loan here" : "Your loans here"}
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {openLoans.map((loan) => (
              <li key={loan.id}>
                <LoanCard loan={loan} showCooperative={false} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Quick actions. "Apply for a loan" is hidden while one is already open here. */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" render={<Link href={`/cooperatives/${id}/savings`} />}>
          <FileText className="size-4" aria-hidden strokeWidth={2} />
          View savings statement
        </Button>

        {activeLoan ? (
          <Button variant="outline" render={<Link href={`/loans/${activeLoan.id}`} />}>
            View loan
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>
        ) : null}

        {membership.status === "active" ? (
          <Button render={<Link href={`/loans/apply?membership=${membership.id}`} />}>
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            Apply for a loan
          </Button>
        ) : null}
      </div>

      {/* Activity. */}
      <section className="mt-10">
        <h2 className="type-section text-text">Activity</h2>

        {ledger.length === 0 ? (
          <p className="type-body mt-3 text-text-secondary">
            Nothing recorded yet. Contributions and repayments appear here as {cooperative.name}{" "}
            records them.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-feature border border-border bg-surface">
            {ledger.slice(0, 12).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="type-body text-text">
                    {entry.description ??
                      (entry.type === "loan_repayment" ? "Loan repayment" : "Contribution")}
                  </p>
                  <p className="type-caption mt-0.5 text-text-muted">
                    {formatDate(entry.recordedAt)}
                  </p>
                </div>
                <span
                  className={
                    entry.type === "loan_repayment"
                      ? "type-card-title tabular shrink-0 text-text-secondary"
                      : "type-card-title tabular shrink-0 text-emerald"
                  }
                >
                  {entry.type === "loan_repayment" ? "" : "+"}
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
