import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ClipboardCheck, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadDiscoveryProfile } from "@/lib/supabase/cooperative-discovery";
import { ApplyButton } from "./apply-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await loadDiscoveryProfile(id);
  return { title: profile?.name ?? "Cooperative" };
}

/**
 * Cooperative Discovery Profile — blueprint 4.4.
 *
 * Everything needed to decide whether to join one cooperative: the description in full, a
 * "Benefits and packages" section describing its loan products in plain terms, and a
 * "Requirements to join" section. The primary action sits near the top and is repeated at the
 * bottom, for anyone who reads the whole page first.
 *
 * Minimum-savings ratios are stated the way the blueprint words them — "loans require 35% of the
 * requested amount already saved" — rather than as a bare decimal, because this screen is for
 * deciding, not for reading data.
 */
export default async function DiscoveryProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;

  const profile = await loadDiscoveryProfile(id);
  if (profile === null) {
    // Null covers both "no session" and "no such active cooperative"; the layout above has
    // already redirected anyone unauthenticated, so at this point it is genuinely not found.
    notFound();
  }

  const fromOnboarding = from === "onboarding";
  const backHref = fromOnboarding ? "/onboarding/cooperatives" : "/cooperatives/discover";

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-8 md:px-8 md:py-10">
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href={backHref} />}>
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        {fromOnboarding ? "Back to setting up" : "All cooperatives"}
      </Button>

      <header className="mt-6 flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
        >
          <Building2 className="size-6" strokeWidth={1.75} />
        </span>

        <div className="min-w-0">
          <h1 className="type-page-title text-text">{profile.name}</h1>
          {profile.description ? (
            <p className="type-body mt-3 text-text-secondary">{profile.description}</p>
          ) : null}
        </div>
      </header>

      <div className="mt-8">
        <ApplyButton
          cooperativeId={profile.id}
          cooperativeName={profile.name}
          membershipStatus={profile.membershipStatus}
          returnTo={fromOnboarding ? "onboarding" : null}
        />
      </div>

      {/* Benefits and packages */}
      <section className="mt-12" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="type-section flex items-center gap-2 text-text">
          <PiggyBank aria-hidden strokeWidth={1.75} className="size-5 text-emerald" />
          Benefits and packages
        </h2>

        {profile.loanProducts.length === 0 ? (
          <p className="type-body mt-3 text-text-secondary">
            This cooperative has not published its loan products on Clarix yet. Ask them directly
            what they offer.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-feature border border-border bg-surface">
            {profile.loanProducts.map((product) => (
              <li key={product.id} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="type-card-title text-text">{product.name}</h3>
                  <span className="type-caption text-text-muted">
                    Up to {product.maxTenureMonths} months to repay
                  </span>
                </div>

                <p className="type-secondary mt-2 text-text-secondary">
                  Loans require {formatRatio(product.minSavingsRatio)} of the requested amount
                  already saved with this cooperative.
                </p>

                {product.interestTerms ? (
                  <p className="type-secondary mt-2 text-text-muted">{product.interestTerms}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Requirements to join */}
      <section className="mt-10" aria-labelledby="requirements-heading">
        <h2 id="requirements-heading" className="type-section flex items-center gap-2 text-text">
          <ClipboardCheck aria-hidden strokeWidth={1.75} className="size-5 text-indigo" />
          Requirements to join
        </h2>

        <p className="type-body mt-3 text-text-secondary">
          {profile.requirements ??
            "This cooperative has not listed any joining requirements on Clarix. Your application will be reviewed by its own staff."}
        </p>
      </section>

      {/* The blueprint asks for the action again at the bottom, for anyone who read it all. */}
      <div className="mt-12 border-t border-border pt-8">
        <ApplyButton
          cooperativeId={profile.id}
          cooperativeName={profile.name}
          membershipStatus={profile.membershipStatus}
          returnTo={fromOnboarding ? "onboarding" : null}
        />
      </div>
    </div>
  );
}

/** 0.35 -> "35%". Trims a trailing ".0" so common ratios read cleanly. */
function formatRatio(ratio: number): string {
  const percent = ratio * 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1)}%`;
}
