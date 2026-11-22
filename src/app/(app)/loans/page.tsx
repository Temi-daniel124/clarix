import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapacityMeter } from "@/components/clarix/capacity-meter";
import { LoanCard } from "@/components/clarix/loan-card";
import { loadCapacity, loadLoans } from "@/lib/supabase/loans-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Loans" };

/**
 * Loans (blueprint 5.4), the cross-cooperative overview.
 *
 * "What do I owe, in total, and where", without a trip through My Cooperatives first. The
 * capacity figures from the Dashboard are deliberately repeated at the top: an employee arriving
 * on this tab should not have to backtrack to Home to see them.
 */
export default async function LoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [capacity, loans] = await Promise.all([loadCapacity(), loadLoans()]);

  const open = loans.filter(
    (loan) =>
      loan.status === "active" || loan.status === "reserved" || loan.status === "pending_review",
  );
  const settled = loans.filter(
    (loan) => loan.status === "completed" || loan.status === "rejected" || loan.status === "expired",
  );

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="type-page-title text-text">Loans</h1>
          <p className="type-body mt-2 text-text-secondary">
            Everything you owe through Clarix, across every cooperative.
          </p>
        </div>

        <Button render={<Link href="/loans/apply" />}>
          <Plus className="size-4" aria-hidden strokeWidth={2.5} />
          New application
        </Button>
      </div>

      {capacity ? (
        <section className="mt-8 rounded-feature border border-border bg-surface p-5 md:p-6">
          <CapacityMeter
            cap={capacity.cap}
            committed={capacity.committed}
            caption="Your monthly deduction limit, and what every cooperative has committed against it so far."
          />
        </section>
      ) : null}

      {open.length === 0 && settled.length === 0 ? (
        <div className="mt-8 rounded-feature border border-border bg-surface p-8 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Receipt className="size-5" strokeWidth={1.75} />
          </span>
          <h2 className="type-card-title mt-5 text-text">You have no loans on Clarix</h2>
          <p className="type-secondary mx-auto mt-2 max-w-[420px] text-text-secondary">
            When you apply for one, it appears here, and the amount it would take from your
            salary each month is checked against your limit before you commit to asking.
          </p>
          <Button className="mt-6" render={<Link href="/loans/apply" />}>
            Apply for a loan
          </Button>
        </div>
      ) : null}

      {open.length > 0 ? (
        <section className="mt-8">
          <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">
            Open
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {open.map((loan) => (
              <li key={loan.id}>
                <LoanCard loan={loan} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {settled.length > 0 ? (
        <section className="mt-10">
          <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">Settled</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {settled.map((loan) => (
              <li key={loan.id}>
                <LoanCard loan={loan} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
