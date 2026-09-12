"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, TriangleAlert } from "lucide-react";
import { springStandard } from "@/lib/motion";

/**
 * The small per-section confirmation blueprint 6.2 asks for, instead of one high-stakes submit
 * at the foot of a long form.
 *
 * It appears beside the button that caused it and says what changed, then stays — a confirmation
 * that fades itself out after a second or two is a confirmation someone can miss, and this
 * screen is not short of room for one line of text. It is announced politely rather than
 * asserted, because saving a phone number is not an alert.
 */
export function SectionFeedback({ saved, error }: { saved?: string; error?: string }) {
  const reduceMotion = useReducedMotion();
  const message = error ?? saved;

  return (
    <div aria-live="polite" className="min-h-5">
      <AnimatePresence initial={false} mode="wait">
        {message ? (
          <motion.p
            key={message}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={reduceMotion ? { duration: 0 } : springStandard}
            className={`flex items-center gap-2 type-caption ${
              error ? "text-danger" : "text-emerald"
            }`}
          >
            {error ? (
              <TriangleAlert className="size-3.5" aria-hidden strokeWidth={2} />
            ) : (
              <Check className="size-3.5" aria-hidden strokeWidth={2.5} />
            )}
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
