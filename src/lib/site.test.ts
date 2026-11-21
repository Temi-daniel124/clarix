import { afterEach, expect, test, vi } from "vitest";
import { siteUrl } from "./site";

afterEach(() => vi.unstubAllEnvs());

test("prefers the configured site URL and strips the slash", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://clarix-orpin.vercel.app/");
  expect(siteUrl()).toBe("https://clarix-orpin.vercel.app");
});

test("falls back to the Vercel production domain", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "clarix.example.ng");
  expect(siteUrl()).toBe("https://clarix.example.ng");
});

test("falls back to localhost", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
  expect(siteUrl()).toBe("http://localhost:3000");
});
