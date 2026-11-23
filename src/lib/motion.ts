import type { Transition } from "motion/react";

/**
 * The one standard spring, per DESIGN_SYSTEM.md § Motion.
 *
 * Used for card expand/collapse, tab pill movement, button state changes and bottom-sheet
 * open, everywhere. A component must never declare its own stiffness/damping: the whole
 * point is that every moving thing in Clarix reads as the same physical object.
 */
export const springStandard: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 0.9,
};

/**
 * The single sanctioned variant, reserved exclusively for rolling-number digit columns.
 * The extra weight is what makes a figure read as "counting something real".
 */
export const springRollingDigit: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 20,
  mass: 1.4,
};

/** Page transitions: 180–240ms fade plus a small horizontal shift. No spring. */
export const pageTransition: Transition = {
  duration: 0.22,
  ease: [0.22, 0.61, 0.36, 1],
};

/** Hover, toasts, chips and the page cross-fade: 160ms on the house ease (DESIGN_SYSTEM.md §4.6). */
export const fadeQuick: Transition = {
  duration: 0.16,
  ease: [0.22, 0.61, 0.36, 1],
};

/**
 * Public site only: a section entering the viewport, once. 480ms, opacity 0 to 1 and 24px up to 0
 * (§4.6). Use with `whileInView` and `viewport={{ once: true }}`.
 */
export const scrollReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] } satisfies Transition,
} as const;

/**
 * Public site only: the hero background carousel. A 1200ms opacity cross-fade, a new slide every
 * 6 seconds (§4.6, D046). Under reduced motion the carousel stays on its first slide.
 */
export const heroCrossfade = {
  // §4.6 gives the duration only; it uses the house ease the other timed values share.
  transition: { duration: 1.2, ease: [0.22, 0.61, 0.36, 1] } satisfies Transition,
  intervalMs: 6000,
} as const;

/** The instant fallback substituted for any spring when prefers-reduced-motion is set. */
export const reducedMotionTransition: Transition = { duration: 0 };
