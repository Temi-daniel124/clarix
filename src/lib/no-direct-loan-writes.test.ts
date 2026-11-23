import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * BUILD-PLAN 0.6: every change to a loan goes through a SECURITY DEFINER function
 * (submit_loan_application, decide_loan_application, complete_loan, expire_lapsed_reservations,
 * record_existing_loan). Migration 034 removed the database's direct write path; this keeps the
 * app from growing one back, which would now fail at runtime with "permission denied" anyway.
 */

const SRC = join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

describe("no direct writes to loans (BUILD-PLAN 0.6)", () => {
  it("never inserts, updates, upserts or deletes loans through the client", () => {
    const offenders = sourceFiles(SRC).filter((file) =>
      /\.from\(\s*["'`]loans["'`]\s*\)\s*\.(insert|update|upsert|delete)\(/.test(
        // Collapse whitespace so a chain split across lines is still caught.
        readFileSync(file, "utf8").replace(/\s+/g, " "),
      ),
    );

    expect(offenders.map((file) => relative(SRC, file))).toEqual([]);
  });
});
