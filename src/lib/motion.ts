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
  damping: 24,
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

/** Page transitions: a 240ms fade plus a small horizontal shift, like a native app. No spring. */
export const pageTransition: Transition = {
  duration: 0.24,
  ease: [0.22, 0.61, 0.36, 1],
};

/** The horizontal shift, in pixels, that accompanies a page transition's fade. */
export const PAGE_SHIFT_PX = 24;

/** Substituted for any spring when prefers-reduced-motion is set: a short fade, not a cut. */
export const reducedMotionTransition: Transition = { duration: 0.12 };
