import { describe, expect, it } from "vitest";
import { sharesLiveDataOutsideProduction } from "./environment";

describe("sharesLiveDataOutsideProduction (D043, BUILD-PLAN 0.4)", () => {
  it("is false on Production, the one place the strip never shows", () => {
    expect(sharesLiveDataOutsideProduction("production")).toBe(false);
  });

  it("is true on a Vercel Preview", () => {
    expect(sharesLiveDataOutsideProduction("preview")).toBe(true);
  });

  it("is true for vercel dev and a plain local next dev, which also use the live project", () => {
    expect(sharesLiveDataOutsideProduction("development")).toBe(true);
    expect(sharesLiveDataOutsideProduction(undefined)).toBe(true);
  });
});
