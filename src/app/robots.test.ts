import { afterEach, expect, test, vi } from "vitest";
import robots from "./robots";
import { PRIVATE_PREFIXES } from "@/lib/site";

afterEach(() => vi.unstubAllEnvs());

test("blocks every private area and points at the sitemap", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://clarix-orpin.vercel.app");
  const r = robots();
  const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
  expect(rule.allow).toBe("/");
  expect(rule.disallow).toEqual([...PRIVATE_PREFIXES]);
  expect(r.sitemap).toBe("https://clarix-orpin.vercel.app/sitemap.xml");
});
