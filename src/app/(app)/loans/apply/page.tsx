import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { loadCapacity } from "@/lib/supabase/loans-data";
import { ApplicationForm, type ApplyTarget } from "./application-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Apply for a loan" };

/**
 * Loan Application (blueprint 5.5).
 *
 * Reached either from a cooperative (with ?membership=) or from the Loans tab, which per the
 * blueprint opens a cooperative-selection step first for anyone who belongs to more than one.
 */
export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ membership?: string }>;
}) {
  const { membership } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("cooperative_memberships")
    .select("id, cooperative_id, savings_balance, cooperatives(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const active = memberships ?? [];

  if (active.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-5 py-10 md:px-8">
        <h1 className="type-page-title text-text">No cooperative to borrow from yet</h1>
        <p className="type-body mt-3 text-text-secondary">
          A loan is always from a specific cooperative, so you need an active membership before
          you can apply for one.
        </p>
        <Button className="mt-6" render={<Link href="/cooperatives/discover" />}>
          Browse cooperatives
        </Button>
      </div>
    );
  }

  const chosen = membership
    ? active.find((row) => row.id === membership)
    : active.length === 1
      ? active[0]
      : undefined;

  // The cooperative-selection step the blueprint asks for.
  if (!chosen) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-5 py-10 md:px-8">
        <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/loans" />}>
          <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
          Loans
        </Button>

        <h1 className="type-page-title mt-6 text-text">Which cooperative?</h1>
        <p className="type-body mt-3 text-text-secondary">
          A loan is always from one cooperative. Your limit, though, is shared across all of them.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {active.map((row) => {
            const cooperative = Array.isArray(row.cooperatives)
              ? row.cooperatives[0]
              : row.cooperatives;

            return (
              <li key={row.id}>
                <Link
                  href={`/loans/apply?membership=${row.id}`}
                  className="flex items-center gap-4 rounded-card border border-border bg-surface p-5 transition-colors duration-150 hover:border-text-muted/50 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
                >
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
                  >
                    <Building2 className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="type-card-title text-text">{cooperative?.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const { data: products } = await supabase
    .from("cooperative_loan_products")
    .select("id, name, min_savings_ratio, max_tenure_months, interest_terms")
    .eq("cooperative_id", chosen.cooperative_id)
    .order("name");

  const capacity = await loadCapacity();
  const cooperative = Array.isArray(chosen.cooperatives)
    ? chosen.cooperatives[0]
    : chosen.cooperatives;

  const target: ApplyTarget = {
    membershipId: chosen.id,
    cooperativeId: chosen.cooperative_id,
    cooperativeName: cooperative?.name ?? "Cooperative",
    savingsBalance: Number(chosen.savings_balance ?? 0),
    products: (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      minSavingsRatio: Number(p.min_savings_ratio),
      maxTenureMonths: p.max_tenure_months,
      interestTerms: p.interest_terms,
    })),
  };

  return (
    <div className="mx-auto w-full max-w-[640px] px-5 py-8 md:px-8 md:py-10">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link href={`/cooperatives/${chosen.cooperative_id}`} />}
      >
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        Back
      </Button>

      <ApplicationForm
        target={target}
        cap={capacity?.cap ?? 0}
        committed={capacity?.committed ?? 0}
      />
    </div>
  );
}
