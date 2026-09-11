"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Building2, Check, Search, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";
import { applyToCooperativeAction, type StepState } from "../actions";

const INITIAL: StepState = {};

export type BrowsableCooperative = {
  id: string;
  name: string;
  description: string | null;
  requirements: string | null;
  applied: boolean;
};

/**
 * Join a Cooperative — blueprint 2.5.
 *
 * The browsing layer, not the decision layer: a searchable list showing just enough to decide
 * whether to look closer. The full discovery profile (blueprint 4.2) is where a cooperative's
 * packages and benefits belong, and it is not built yet, so applying happens inline here for now.
 *
 * "Skip for now" is honest and prominent: an employee can finish onboarding without joining
 * anything and land on a dashboard that invites them to, rather than being held at a gate.
 */
export function CooperativeBrowser({
  cooperatives,
  organizationName,
}: {
  cooperatives: BrowsableCooperative[];
  organizationName: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [state, formAction, pending] = useActionState(applyToCooperativeAction, INITIAL);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState<string[]>(
    cooperatives.filter((entry) => entry.applied).map((entry) => entry.id),
  );

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

  return (
    <div className="pt-10">
      <h1 className="type-page-title text-text">Join a cooperative</h1>
      <p className="type-body mt-3 text-text-secondary">
        Apply to the cooperatives you belong to at {organizationName}. Each one reviews your
        application itself — Clarix does not decide who becomes a member.
      </p>

      {state.error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-card border border-danger/30 px-4 py-3 type-secondary text-danger"
          style={{ backgroundColor: "color-mix(in srgb, var(--clarix-danger) 8%, transparent)" }}
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden strokeWidth={2} />
          {state.error}
        </p>
      ) : null}

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
              No cooperative matches “{query}”. Check the spelling, or ask your cooperative
              whether it is on Clarix yet.
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {filtered.map((cooperative) => {
                const isApplied = applied.includes(cooperative.id);

                return (
                  <motion.li
                    key={cooperative.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduceMotion ? { duration: 0 } : springStandard}
                    className="rounded-card border border-border bg-surface p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary"
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
                            {cooperative.requirements}
                          </span>
                        ) : null}
                      </div>

                      {isApplied ? (
                        <span className="flex shrink-0 items-center gap-1.5 type-caption text-emerald">
                          <Check className="size-3.5" strokeWidth={3} aria-hidden />
                          Applied
                        </span>
                      ) : (
                        <form action={formAction} className="shrink-0">
                          <input type="hidden" name="cooperativeId" value={cooperative.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={pending}
                            onClick={() => setApplied((current) => [...current, cooperative.id])}
                          >
                            Apply
                          </Button>
                        </form>
                      )}
                    </div>
                  </motion.li>
                );
              })}
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
          <h2 className="type-card-title mt-5 text-text">
            No cooperatives are on Clarix yet
          </h2>
          <p className="type-secondary mx-auto mt-2 max-w-[380px] text-text-secondary">
            Cooperatives are set up by Clarix during their own onboarding, so they appear here as
            each one joins. Your account is ready, and you can come back to this at any time.
          </p>
        </div>
      )}

      <div className={cn("mt-10 flex items-center gap-4", hasAny ? "" : "justify-center")}>
        <Button onClick={() => router.push("/dashboard")} className="flex-1 sm:flex-none">
          {applied.length > 0 ? "Done" : "Continue to my dashboard"}
        </Button>

        {hasAny && applied.length === 0 ? (
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Skip for now
          </Button>
        ) : null}
      </div>
    </div>
  );
}
