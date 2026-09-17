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
 * The roster import's judgement, tested without a browser or a database: the same split
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

/**
 * A real cooperative's sheet is not the three-column template. These are the shapes that actually
 * turned up when the importer was tested against realistic files, including the two that used to
 * map silently to the wrong column.
 */
const NEWLINE = String.fromCharCode(10);

describe("a real cooperative's own spreadsheet", () => {
  const headersOf = (line: string) => parseCsv(line + NEWLINE + "1,2,3,4,5,6,7").headers;

  const mapped = (line: string) => {
    const headers = headersOf(line);
    const mapping = guessMapping(headers);
    return {
      employeeId: headers[mapping.employeeId ?? -1] ?? null,
      name: headers[mapping.name ?? -1] ?? null,
      savingsBalance: headers[mapping.savingsBalance ?? -1] ?? null,
    };
  };

  it("reads the columns it knows and ignores the rest of a five-column sheet", () => {
    expect(mapped("S/N,Full Name,IPPIS Number,Total Savings,Phone")).toEqual({
      employeeId: "IPPIS Number",
      name: "Full Name",
      savingsBalance: "Total Savings",
    });
  });

  it("does the same on thirteen columns", () => {
    expect(
      mapped(
        "S/N,Surname and Other Names,IPPIS No,Department,Grade Level,Date Joined,Monthly Contribution,Total Savings,Loan Balance,Bank Name,Account Number,Next of Kin Name,Phone",
      ),
    ).toEqual({
      employeeId: "IPPIS No",
      name: "Surname and Other Names",
      savingsBalance: "Total Savings",
    });
  });

  /**
   * This used to import every member's debt as their savings. "Loan Balance" contains "balance",
   * and the old matcher took the leftmost header that contained any synonym.
   */
  it("never mistakes a loan balance for a savings balance, whatever the column order", () => {
    expect(mapped("S/N,IPPIS,Loan Balance,Member,Contributions To Date,Phone").savingsBalance).toBe(
      "Contributions To Date",
    );
  });

  /** This used to name every member after their next of kin, for the same reason. */
  it("never mistakes a next of kin for the member", () => {
    expect(mapped("Staff No,Next of Kin Name,Member Full Name,Savings,Dept,Phone").name).toBe(
      "Member Full Name",
    );
  });

  it("is not fooled by a bank name column either", () => {
    expect(mapped("IPPIS,Bank Name,Surname and Other Names,Total Savings,Dept,Phone").name).toBe(
      "Surname and Other Names",
    );
  });

  it("handles rows shorter than the header row, which is what trailing blanks produce", () => {
    const sheet = parseCsv(
      ["Staff ID,Name,Savings,Notes", "300301,Ada Nwosu,1000", "300302,Tunde Bello"].join(NEWLINE),
    );
    const rows = prepareRows(sheet.rows, guessMapping(sheet.headers), {
      employeeIdPattern: "^[0-9]{6}$",
    });

    expect(rows.map((row) => [row.employeeId, row.name, row.savingsBalance, row.status])).toEqual([
      ["300301", "Ada Nwosu", 1000, "ready"],
      ["300302", "Tunde Bello", 0, "ready"],
    ]);
  });
});
