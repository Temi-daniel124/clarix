import { describe, expect, it } from "vitest";
import { parseCsv } from "./parse";
import {
  countByStatus,
  duplicateMappings,
  guessMapping,
  parseAmount,
  prepareRows,
} from "./mapping";

/**
 * The roster import's judgement, tested without a browser or a database — the same split
 * docs/DEVELOPMENT-WORKFLOW.md § 3 uses for the eligibility arithmetic.
 *
 * The headings below are the ones real cooperative sheets use: IPPIS is the payroll system's own
 * name for the staff number, and "contribution" is what most cooperatives call savings.
 */

const PATTERN = "^[0-9]{6}$";

describe("guessMapping", () => {
  it("matches the headings a cooperative actually types", () => {
    const mapping = guessMapping(["IPPIS No.", "Surname and Other Names", "Contribution Balance"]);

    expect(mapping.employeeId).toBe(0);
    expect(mapping.name).toBe(1);
    expect(mapping.savingsBalance).toBe(2);
  });

  it("resolves a heading that merely contains a known synonym", () => {
    const mapping = guessMapping(["Staff No (new)", "Member Name", "Total Savings ₦"]);

    expect(mapping.employeeId).toBe(0);
    expect(mapping.savingsBalance).toBe(2);
  });

  it("leaves a column it cannot resolve for the admin to map by hand", () => {
    const mapping = guessMapping(["Column A", "Column B"]);

    expect(mapping.employeeId).toBeNull();
    expect(mapping.savingsBalance).toBeNull();
  });

  it("never maps one source column to two fields", () => {
    const mapping = guessMapping(["Name"]);

    const used = Object.values(mapping).filter((index) => index !== null);
    expect(new Set(used).size).toBe(used.length);
  });
});

describe("prepareRows", () => {
  const mapping = { employeeId: 0, name: 1, savingsBalance: 2 };

  it("accepts a clean row", () => {
    const rows = prepareRows([["204817", "Adaeze Obi", "120000"]], mapping, {
      employeeIdPattern: PATTERN,
    });

    expect(rows[0].status).toBe("ready");
    expect(rows[0].savingsBalance).toBe(120_000);
  });

  it("treats a missing savings figure as zero rather than a problem", () => {
    const rows = prepareRows([["204817", "Adaeze Obi", ""]], mapping, {
      employeeIdPattern: PATTERN,
    });

    expect(rows[0].status).toBe("ready");
    expect(rows[0].savingsBalance).toBe(0);
  });

  it("excludes a row with no staff ID, because it can never be matched to anybody", () => {
    const rows = prepareRows([["", "Adaeze Obi", "120000"]], mapping, {
      employeeIdPattern: PATTERN,
    });

    expect(rows[0].status).toBe("invalid");
  });

  it("rejects a staff ID that does not match the organization's format", () => {
    const rows = prepareRows([["ABC", "Adaeze Obi", "1000"]], mapping, {
      employeeIdPattern: PATTERN,
    });

    expect(rows[0].status).toBe("invalid");
  });

  it("flags the second appearance of a staff ID and names the row it duplicates", () => {
    const rows = prepareRows(
      [
        ["204817", "Adaeze Obi", "1000"],
        ["204817", "Adaeze O.", "1500"],
      ],
      mapping,
      { employeeIdPattern: PATTERN },
    );

    expect(rows[0].status).toBe("ready");
    expect(rows[1].status).toBe("invalid");
    expect(rows[1].issues[0]).toContain("row 1");
  });

  it("lets a row through without a name, saying what the consequence is", () => {
    const rows = prepareRows([["204817", "", "1000"]], mapping, { employeeIdPattern: PATTERN });

    expect(rows[0].status).toBe("needs_review");
    expect(rows[0].issues[0]).toContain("staff ID alone");
  });

  it("counts the whole import at a glance", () => {
    const rows = prepareRows(
      [
        ["204817", "Adaeze Obi", "1000"],
        ["204818", "", "2000"],
        ["", "Nobody", "3000"],
      ],
      mapping,
      { employeeIdPattern: PATTERN },
    );

    expect(countByStatus(rows)).toEqual({ ready: 1, needs_review: 1, invalid: 1 });
  });
});

describe("duplicateMappings", () => {
  it("flags two fields pointed at one column rather than resolving it silently", () => {
    expect(duplicateMappings({ employeeId: 0, name: 0, savingsBalance: 1 })).toContain("name");
  });

  it("is empty when every field has its own column", () => {
    expect(duplicateMappings({ employeeId: 0, name: 1, savingsBalance: 2 })).toEqual([]);
  });
});

describe("parseAmount", () => {
  it("reads a figure a treasurer would actually type", () => {
    expect(parseAmount("₦120,000.50")).toBe(120_000.5);
  });

  it("treats an empty cell as zero", () => {
    expect(parseAmount("")).toBe(0);
  });

  it("refuses something that is not a number at all", () => {
    expect(parseAmount("see attached")).toBeNull();
  });

  it("refuses a negative balance", () => {
    expect(parseAmount("-500")).toBeNull();
  });
});

describe("parseCsv", () => {
  it("reads quoted fields, embedded commas and CRLF line endings", () => {
    const sheet = parseCsv('IPPIS,Name,Savings\r\n204817,"Obi, Adaeze",120000\r\n');

    expect(sheet.headers).toEqual(["IPPIS", "Name", "Savings"]);
    expect(sheet.rows).toEqual([["204817", "Obi, Adaeze", "120000"]]);
  });

  it("handles an escaped quote inside a quoted field", () => {
    const sheet = parseCsv('Name\n"She said ""yes"""');

    expect(sheet.rows[0][0]).toBe('She said "yes"');
  });

  it("drops the byte-order mark Excel writes in front of a CSV", () => {
    const sheet = parseCsv("﻿IPPIS,Name\n204817,Adaeze");

    expect(sheet.headers[0]).toBe("IPPIS");
  });

  it("ignores blank lines rather than importing empty members", () => {
    const sheet = parseCsv("IPPIS,Name\n204817,Adaeze\n\n\n");

    expect(sheet.rows).toHaveLength(1);
  });
});
