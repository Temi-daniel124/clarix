"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { springStandard } from "@/lib/motion";

const DISMISS_KEY = "clarix.dashboard.join-prompt-dismissed";

/**
 * The quiet prompt to browse Discovery (blueprint 4.1), which asks for exactly this and is
 * explicit that it "never appears as an aggressive banner". So: no colour fill, no icon shouting
 * at the reader, a plain dismiss, and it does not come back once dismissed.
 *
 * It only renders when there are cooperatives the employee has not joined.
 */
export function JoinPrompt({ unjoinedCount }: { unjoinedCount: number }) {
  const reduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });

  if (unjoinedCount <= 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Storage blocked; it simply reappears next session.
    }
  };

  return (
    <AnimatePresence>
      {dismissed ? null : (
        <motion.section
          initial={false}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={reduceMotion ? { duration: 0 } : springStandard}
          className="mt-10 flex items-center gap-4 rounded-card border border-border px-5 py-4"
        >
          <p className="type-secondary flex-1 text-text-secondary">
            {unjoinedCount === 1
              ? "There is one more cooperative at your organization you have not joined."
              : `There are ${unjoinedCount} more cooperatives at your organization you have not joined.`}
          </p>

          <Button size="sm" variant="outline" render={<Link href="/cooperatives/discover" />}>
            Browse
            <ArrowRight className="size-3.5" aria-hidden strokeWidth={2.5} />
          </Button>

          <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dismiss">
            <X className="size-4" strokeWidth={2} />
          </Button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
