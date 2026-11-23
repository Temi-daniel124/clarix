import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * D048 / SECURITY.md: no demo password, and no demo variable name, ever reaches the browser.
 * Runs after `npm run build` (`npm run test:bundle`), over everything Next ships to the client.
 * CI builds with canary values in DEMO_PASSWORD_*, so a password that leaked would be found by
 * value as well as by name.
 */

const CLIENT_DIR = join(process.cwd(), ".next", "static");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("the built client output", () => {
  it("exists (run `npm run build` first)", () => {
    expect(existsSync(CLIENT_DIR)).toBe(true);
  });

  const shipped = existsSync(CLIENT_DIR)
    ? files(CLIENT_DIR).filter((path) => /\.(js|css|html|json|txt|map)$/.test(path))
    : [];
  const secrets = Object.entries(process.env)
    .filter(([name, value]) => name.startsWith("DEMO_PASSWORD_") && value && value.length >= 6)
    .map(([, value]) => value as string);

  it("contains no demo variable name", () => {
    const hits = shipped.filter((path) => /DEMO_PASSWORD|DEMO_EMAIL_/.test(readFileSync(path, "utf8")));
    expect(hits).toEqual([]);
  });

  it("contains no demo password value", () => {
    const hits = shipped.filter((path) => {
      const text = readFileSync(path, "utf8");
      return secrets.some((secret) => text.includes(secret));
    });
    expect(hits).toEqual([]);
  });
});
