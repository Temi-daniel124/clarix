import { test, expect } from "vitest";
import { estimateBill, normaliseMemberCount, formatNaira } from "./pricing";

test("180 active members, monthly", () =>
  expect(estimateBill(180, "monthly")).toEqual({ monthly: 27000, total: 27000, minimumApplied: false }));
test("yearly charges ten months", () => expect(estimateBill(180, "yearly").total).toBe(270000));
test("small cooperatives pay the minimum", () =>
  expect(estimateBill(12, "monthly")).toEqual({ monthly: 5000, total: 5000, minimumApplied: true }));
test("zero members still shows the minimum, never zero or negative", () =>
  expect(estimateBill(0, "yearly")).toEqual({ monthly: 5000, total: 50000, minimumApplied: true }));
test.each([
  ["", 0],
  [-5, 0],
  [12.9, 12],
  ["abc", 0],
  [250000, 100000],
  [" 42 ", 42],
  [null, 0],
  [undefined, 0],
  [Infinity, 0],
])("normalises %p to %p", (i, o) => expect(normaliseMemberCount(i)).toBe(o));
test("formats naira", () => expect(formatNaira(1248500)).toBe("₦1,248,500"));
