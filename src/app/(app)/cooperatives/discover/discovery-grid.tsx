"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Building2, Check, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { springStandard } from "@/lib/motion";
import type { DiscoveryCard } from "@/lib/supabase/cooperative-discovery";

/**
 * Discovery grid (blueprint 4.3).
 *
 * A search field, then a card grid: two columns on mobile, three on desktop. Cards an employee
 * has not joined carry a "Not joined" label and a slightly different accent from the joined
 * ones, which is the blueprint's way of making sure this list is never confused with My
 * Cooperatives.
 *
 * The blueprint allows a cooperative-supplied logo or accent colour here, as one of the few
 * places a little visual variety is intentional. No cooperative supplies one yet. There is no
 * column for it, so every card uses the neutral mark until that exists, rather than inventing
 * colours on their behalf.
 */
export function DiscoveryGrid({ cards }: { cards: DiscoveryCard[] }) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter(
      (card) =>
        card.name.toLowerCase().includes(needle) ||
        (card.description ?? "").toLowerCase().includes(needle),
    );
  }, [cards, query]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-8 md:px-8 md:py-10">
      <h1 className="type-page-title text-text">Discover cooperatives</h1>
      <p className="type-body mt-2 max-w-[560px] text-text-secondary">
        Every cooperative at your organization that is on Clarix. Only public information appears
        here, what a cooperative offers and what it asks of members.
      </p>

      <div className="relative mt-8 max-w-[420px]">
        <Search
          aria-hidden
          strokeWidth={2}
          className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4 text-text-muted"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or description"
          aria-label="Search cooperatives"
          className="pl-12"
        />
      </div>

      {cards.length === 0 ? (
        <div className="mt-8 rounded-feature border border-border bg-surface p-8 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Building2 className="size-5" strokeWidth={1.75} />
          </span>
          <h2 className="type-card-title mt-5 text-text">No cooperatives are on Clarix yet</h2>
          <p className="type-secondary mx-auto mt-2 max-w-[400px] text-text-secondary">
            Cooperatives are set up during their own onboarding, so they appear here as each one
            joins.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 type-body text-text-secondary">
          No cooperative matches &ldquo;{query}&rdquo;. Check the spelling, or ask your
          cooperative whether it is on Clarix yet.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {filtered.map((card, index) => (
            <motion.li
              key={card.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion ? { duration: 0 } : { ...springStandard, delay: index * 0.04 }
              }
            >
              <Link
                href={`/cooperatives/discover/${card.id}`}
                className={cn(
                  "flex h-full flex-col rounded-card border bg-surface p-4 transition-colors duration-150 md:p-5",
                  "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
                  card.joined
                    ? "border-emerald/30 hover:border-emerald/50"
                    : "border-border hover:border-text-muted/50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-card border",
                      card.joined
                        ? "border-emerald/30 text-emerald"
                        : "border-border text-text-secondary",
                    )}
                  >
                    <Building2 className="size-5" strokeWidth={1.75} />
                  </span>

                  <StatusLabel card={card} />
                </div>

                <h2 className="type-card-title mt-4 text-text">{card.name}</h2>

                {card.description ? (
                  <p className="type-secondary mt-2 line-clamp-3 text-text-secondary">
                    {card.description}
                  </p>
                ) : null}

                {card.requirements ? (
                  /* One word, and never wrapped: "Requirements apply" needed 134px and a
                     two-column card at 360px has 122, so it broke onto two lines inside a fully
                     rounded border. The card itself links through to what the requirements are. */
                  <span className="mt-4 inline-flex w-fit whitespace-nowrap rounded-full border border-border px-3 py-1 type-caption text-text-secondary">
                    Requirements
                  </span>
                ) : null}
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusLabel({ card }: { card: DiscoveryCard }) {
  if (card.membershipStatus === "active") {
    return (
      <span className="flex shrink-0 items-center gap-2 type-caption text-emerald">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
        Joined
      </span>
    );
  }

  if (card.membershipStatus === "pending") {
    return (
      <span className="flex shrink-0 items-center gap-2 type-caption text-warning">
        <Clock className="size-3.5" strokeWidth={2} aria-hidden />
        Applied
      </span>
    );
  }

  return <span className="shrink-0 type-caption text-text-muted">Not joined</span>;
}
