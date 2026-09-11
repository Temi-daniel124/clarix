"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { springStandard } from "@/lib/motion";
import type { Insight } from "@/lib/supabase/dashboard-data";

/**
 * Clarix Insights — blueprint 4.1.
 *
 * Text-led cards, swipeable on mobile, never autoplaying: the blueprint is explicit that
 * autoplaying content the employee did not ask to see is a small trust cost on a financial
 * screen. A card that references something navigates there; one that is purely informational
 * is not a link, so nothing pretends to be tappable when it is not.
 */
export function InsightsStrip({ insights }: { insights: Insight[] }) {
  const reduceMotion = useReducedMotion();

  if (insights.length === 0) return null;

  return (
    <section className="mt-8" aria-label="Clarix insights">
      <h2 className="type-caption uppercase tracking-[0.08em] text-text-muted">Insights</h2>

      <ul className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {insights.map((insight, index) => {
          const body = (
            <>
              <Sparkles
                aria-hidden
                strokeWidth={1.75}
                className="size-4 shrink-0 text-emerald"
              />
              <span className="type-secondary text-text-secondary">{insight.text}</span>
            </>
          );

          return (
            <motion.li
              key={insight.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...springStandard, delay: index * 0.05 }}
              className="w-[280px] shrink-0 snap-start md:w-[320px]"
            >
              {insight.href ? (
                <Link
                  href={insight.href}
                  className="flex h-full items-start gap-3 rounded-card border border-border bg-surface p-4 transition-colors duration-150 hover:border-text-muted/40 focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex h-full items-start gap-3 rounded-card border border-border bg-surface p-4">
                  {body}
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
