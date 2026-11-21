import { expect, test } from "vitest";
import { ringArc } from "./brand";

test("two-thirds arc on the 8.5 ring", () => {
  const { dash, gap } = ringArc(8.5);
  expect(dash).toBeCloseTo(35.6, 1);
  expect(gap).toBeCloseTo(53.41, 1);
});

test("the fraction is configurable and the gap is always the full circumference", () => {
  const { dash, gap } = ringArc(10, 0.5);
  expect(gap).toBeCloseTo(2 * Math.PI * 10, 6);
  expect(dash).toBeCloseTo(Math.PI * 10, 6);
});
