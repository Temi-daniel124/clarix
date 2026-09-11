"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/motion";

/**
 * The staggered hero entrance — the one piece of choreography kept from the marketing hero
 * component this page adapts (docs/planning/clarix-design-system.md § 4: keep the
 * choreography, replace the content entirely).
 *
 * A short fade and a small rise, nothing more. The blueprint is explicit that the landing page
 * has no scroll-triggered animation beyond the looping preview, so nothing further down the
 * page moves on its own.
 */
export function HeroReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { ...pageTransition, delay }}
    >
      {children}
    </motion.div>
  );
}
