import { afterEach, expect, test, vi } from "vitest";
import sitemap from "./sitemap";
import { PRIVATE_PREFIXES, PUBLIC_ROUTES } from "@/lib/site";

afterEach(() => vi.unstubAllEnvs());

test("lists only public pages, absolute, with the home page first", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://clarix-orpin.vercel.app");
  const s = sitemap();
  expect(s[0].url).toBe("https://clarix-orpin.vercel.app/");
  expect(s).toHaveLength(PUBLIC_ROUTES.length);
  for (const entry of s) {
    for (const prefix of PRIVATE_PREFIXES) {
      expect(new URL(entry.url).pathname.startsWith(prefix)).toBe(false);
    }
  }
});
