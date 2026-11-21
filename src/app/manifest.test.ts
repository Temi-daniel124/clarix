import { expect, test } from "vitest";
import manifest from "./manifest";

test("manifest is light, generic and installable", () => {
  const m = manifest();
  expect(m.name).toBe("Clarix");
  expect(m.description).not.toMatch(/FMC|salary/i);
  expect(m.background_color).toBe("#F5F6FB");
  expect(m.theme_color).toBe("#F5F6FB");
  expect(m.orientation).toBeUndefined();
  const sizes = (m.icons ?? []).map((i) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
});
