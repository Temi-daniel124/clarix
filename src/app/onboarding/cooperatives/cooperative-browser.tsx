"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Building2, Check, ChevronRight, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";

export type BrowsableCooperative = {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  applied: boolean;
};

/**
 * Join a Cooperative (blueprint 2.5).
 *
 * The browsing layer, not the decision layer. The blueprint is explicit that tapping a row opens
 * the full Cooperative Discovery Profile (4.4), "which is where the actual 'Apply to join'
 * action lives".
 *
 * This screen used to apply inline, because 4.4 did not exist yet. That left two different apply
 * paths which could drift apart, so now every row links into the real profile and carries
 * `?from=onboarding` so that screen knows to offer a way back here rather than into the app.
 *
 * "Skip for now" stays honest and prominent: an employee can finish onboarding without joining
 * anything and land on a dashboard that invites them to, rather than being held at a gate.
 */
export function CooperativeBrowser({ cooperatives }: { cooperatives: BrowsableCooperative[] }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cooperatives;
    return cooperatives.filter(
      (entry) =>
        entry.name.toLowerCase().includes(needle) ||
        (entry.description ?? "").toLowerCase().includes(needle),
    );
  }, [cooperatives, query]);

  const hasAny = cooperatives.length > 0;
  const appliedCount = cooperatives.filter((entry) => entry.applied).length;

  return (
    <div className="pt-10">
      <h1 className="type-page-title text-text">Join a cooperative</h1>
      <p className="type-body mt-3 text-text-secondary">
        Open any cooperative to see what it offers and what it asks of members. Each one reviews
        applications itself. Clarix does not decide who becomes a member.
      </p>

      {hasAny ? (
        <>
          <div className="relative mt-8">
            <Search
              aria-hidden
              strokeWidth={2}
              className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4 text-text-muted"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cooperatives"
              aria-label="Search cooperatives"
              className="pl-11"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="mt-8 type-body text-text-secondary">
              No cooperative matches &ldquo;{query}&rdquo;. Check the spelling, or ask your
              cooperative whether it is on Clarix yet.
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {filtered.map((cooperative, index) => (
                <motion.li
                  key={cooperative.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reduceMotion ? { duration: 0 } : { ...springStandard, delay: index * 0.04 }
                  }
                >
                  <Link
                    href={`/cooperatives/discover/${cooperative.id}?from=onboarding`}
                    className={cn(
                      "flex items-start gap-4 rounded-card border bg-surface p-5 transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
                      cooperative.applied
                        ? "border-emerald/30"
                        : "border-border hover:border-text-muted/50",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-card border",
                        cooperative.applied
                          ? "border-emerald/30 text-emerald"
                          : "border-border text-text-secondary",
                      )}
                    >
                      <Building2 className="size-5" strokeWidth={1.75} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h2 className="type-card-title text-text">{cooperative.name}</h2>
                      {cooperative.description ? (
                        <p className="type-secondary mt-1 text-text-secondary">
                          {cooperative.description}
                        </p>
                      ) : null}

                      {cooperative.requirements ? (
                        <span className="mt-3 inline-flex rounded-full border border-border px-3 py-1 type-caption text-text-secondary">
                          Requirements apply
                        </span>
                      ) : null}
                    </div>

                    {cooperative.applied ? (
                      <span className="flex shrink-0 items-center gap-1.5 type-caption text-warning">
                        <Clock className="size-3.5" strokeWidth={2} aria-hidden />
                        Applied
                      </span>
                    ) : (
                      <ChevronRight
                        aria-hidden
                        strokeWidth={2}
                        className="mt-1 size-4 shrink-0 text-text-muted"
                      />
                    )}
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </>
      ) : (
        /* Empty states explain what to do next rather than saying "no data". */
        <div className="mt-8 rounded-feature border border-border bg-surface p-8 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Building2 className="size-5" strokeWidth={1.75} />
          </span>
          <h2 className="type-card-title mt-5 text-text">No cooperatives are on Clarix yet</h2>
          <p className="type-secondary mx-auto mt-2 max-w-[380px] text-text-secondary">
            Cooperatives are set up by Clarix during their own onboarding, so they appear here as
            each one joins. Your account is ready, and you can come back to this at any time.
          </p>
        </div>
      )}

      <div className={cn("mt-10 flex items-center gap-4", hasAny ? "" : "justify-center")}>
        <Button onClick={() => router.push("/dashboard")} className="flex-1 sm:flex-none">
          {appliedCount > 0 ? (
            <>
              <Check className="size-4" aria-hidden strokeWidth={2.5} />
              Done
            </>
          ) : (
            "Continue to my dashboard"
          )}
        </Button>

        {hasAny && appliedCount === 0 ? (
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Skip for now
          </Button>
        ) : null}
      </div>
    </div>
  );
}
