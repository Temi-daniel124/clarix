import type { Transition } from "motion/react";

/**
 * The one standard spring, per DESIGN_SYSTEM.md § Motion.
 *
 * Used for card expand/collapse, tab pill movement, button state changes and bottom-sheet
 * open — everywhere. A component must never declare its own stiffness/damping: the whole
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

/** The instant fallback substituted for any spring when prefers-reduced-motion is set. */
export const reducedMotionTransition: Transition = { duration: 0 };
