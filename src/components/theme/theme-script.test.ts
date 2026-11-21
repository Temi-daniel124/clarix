import { expect, test } from "vitest";
import { THEME_SCRIPT_SOURCE } from "./theme-script";

test("never applies a dark class, even for a saved dark choice", () => {
  expect(THEME_SCRIPT_SOURCE).not.toMatch(/['"]dark['"]/);
  expect(THEME_SCRIPT_SOURCE).toMatch(/rail-collapsed/);
});

test("clears a stale saved theme so old dark choices disappear", () => {
  expect(THEME_SCRIPT_SOURCE).toMatch(/removeItem\(["']clarix\.theme["']\)/);
});
