import { expect, test } from "vitest";
import { chipClasses } from "./chip";

test("waiting chip uses ochre wash with readable text", () => {
  expect(chipClasses("waiting")).toMatch(/bg-ochre-50/);
  expect(chipClasses("waiting")).toMatch(/text-ochre-ink/);
});

test("every tone is a pill with the flat 12.5px bold type", () => {
  for (const t of ["waiting", "confirmed", "over", "draft", "neutral"] as const) {
    expect(chipClasses(t)).toMatch(/rounded-pill/);
    expect(chipClasses(t)).toMatch(/font-bold/);
  }
  expect(chipClasses("neutral")).toMatch(/shadow-flat/);
});
