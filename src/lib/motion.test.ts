import { expect, test } from "vitest";
import { springStandard, pageTransition, reducedMotionTransition, PAGE_SHIFT_PX } from "./motion";

test("standard spring matches the design system", () => {
  expect(springStandard).toEqual({ type: "spring", stiffness: 260, damping: 24, mass: 0.9 });
});

test("page transition is 240ms with a 24px shift", () => {
  expect(pageTransition.duration).toBe(0.24);
  expect(PAGE_SHIFT_PX).toBe(24);
});

test("reduced motion is a 120ms fade, not an instant cut", () => {
  expect(reducedMotionTransition).toEqual({ duration: 0.12 });
});
