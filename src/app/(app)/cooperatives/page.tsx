import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, ChevronRight, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { loadDashboardData } from "@/lib/supabase/dashboard-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My cooperatives" };

/**
 * My Cooperatives (blueprint 4.2).
 *
 * The browsing and selection layer for cooperatives already joined: one row each, showing the
 * name, the savings balance, and a status indicator. Tapping a row will open that cooperative's
 * Detail screen (blueprint 5.2), which belongs to the loan slice and is not built yet, so rows
 * are not yet links: a row that looks tappable and does nothing is worse than one that does not
 * pretend.
 *
 * "Discover more" sits at the end of the list, keeping "view what I have" and "find what I
 * don't" physically close together as the blueprint asks.
 */
export default async function MyCooperativesPage() {
  const data = await loadDashboardData();
  if (!data) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">My cooperatives</h1>
      <p className="type-body mt-2 text-text-secondary">
        Everywhere you hold a membership, and what you have saved at each.
      </p>

      {data.cooperatives.length === 0 ? (
        <div className="mt-8 rounded-feature border border-border bg-surface p-8 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Building2 className="size-5" strokeWidth={1.75} />
          </span>
          <h2 className="type-card-title mt-5 text-text">No memberships yet</h2>
          <p className="type-secondary mx-auto mt-2 max-w-[400px] text-text-secondary">
            Once you join a cooperative it appears here, with your savings and any loans you hold
            there.
          </p>
          <Button className="mt-6" render={<Link href="/cooperatives/discover" />}>
            Browse cooperatives
            <ArrowRight className="size-4" aria-hidden strokeWidth={2.5} />
          </Button>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {data.cooperatives.map((cooperative) => (
            <li key={cooperative.membershipId}>
              <Link
                href={`/cooperatives/${cooperative.cooperativeId}`}
                className="flex items-center gap-4 rounded-card border border-border bg-surface p-5 transition-colors duration-150 hover:border-text-muted/50 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
              >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
              >
                <Building2 className="size-5" strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="type-card-title text-text">{cooperative.name}</h2>

                {cooperative.status === "active" ? (
                  <p className="type-caption mt-1 text-text-muted">Savings balance</p>
                ) : (
                  <p className="type-caption mt-1 flex items-center gap-1.5 text-warning">
                    <Clock aria-hidden strokeWidth={2} className="size-3.5" />
                    {cooperative.status === "pending"
                      ? "Waiting for this cooperative to review your application"
                      : "Membership suspended"}
                  </p>
                )}
              </div>

                {cooperative.status === "active" ? (
                  <RollingNumber
                    value={cooperative.savingsBalance}
                    className="type-card-title shrink-0 text-text"
                  />
                ) : null}

                <ChevronRight aria-hidden strokeWidth={2} className="size-4 shrink-0 text-text-muted" />
              </Link>
            </li>
          ))}

          <li>
            <Link
              href="/cooperatives/discover"
              className="flex items-center gap-3 rounded-card border border-dashed border-border px-5 py-4 type-body text-text-secondary transition-colors duration-150 hover:border-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-card text-text-muted"
              >
                <Plus className="size-5" strokeWidth={1.75} />
              </span>
              Discover more cooperatives
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
