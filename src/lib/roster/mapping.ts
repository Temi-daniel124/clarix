/**
 * Turning a cooperative's own spreadsheet into rows Clarix can store — blueprint 2.4.
 *
 * Two jobs, both pure and both unit-tested: guess which source column means which Clarix field,
 * and decide whether a given row is ready, needs a look, or cannot be used. Keeping the whole of
 * that judgement here rather than inside the wizard component means the rules can be tested
 * without a browser, and read in one place when somebody's file does something unexpected.
 */

export const ROSTER_FIELDS = {
  employeeId: { label: "Employee ID", required: true },
  name: { label: "Name", required: false },
  savingsBalance: { label: "Savings balance", required: false },
} as const;

export type RosterField = keyof typeof ROSTER_FIELDS;

export const ROSTER_FIELD_ORDER: RosterField[] = ["employeeId", "name", "savingsBalance"];

/**
 * The synonym dictionary MVP-SCOPE.md P0 #2 asks for. These are the headings real FMC Abeokuta
 * cooperative sheets actually use — IPPIS is the payroll system's own name for the staff number,
 * and "contribution" is the word most cooperatives use for savings.
 */
const SYNONYMS: Record<RosterField, string[]> = {
  employeeId: [
    "employee id",
    "employeeid",
    "employee number",
    "ippis",
    "ippis no",
    "ippis number",
    "staff id",
    "staff no",
    "staff number",
    "service number",
    "file number",
  ],
  name: ["name", "full name", "member name", "surname and other names", "staff name", "member"],
  savingsBalance: [
    "savings",
    "savings balance",
    "balance",
    "contribution",
    "contributions",
    "contribution balance",
    "total savings",
    "amount saved",
  ],
};

/**
 * Headings that contain one of our synonyms and mean something else entirely.
 *
 * A real cooperative's sheet is not three columns. It has a loan balance, a bank name, a next of
 * kin, a department — and several of those contain the exact words we search for. Without this,
 * "Loan Balance" is captured as the savings balance whenever it sits to the left of the savings
 * column, and "Next of Kin Name" is captured as the member's name. Both were reproduced against
 * realistic sheets before this list existed; both are silent, and the first imports every member's
 * debt as their savings.
 *
 * A disqualified header is never guessed at. It can still be chosen by hand, because the admin
 * knows their own sheet and this is only a guess.
 */
const DISQUALIFIERS: Record<RosterField, string[]> = {
  employeeId: ["account", "phone", "bank", "kin", "guarantor", "pension"],
  name: ["kin", "bank", "guarantor", "spouse", "branch", "employer", "department", "account"],
  savingsBalance: [
    "loan",
    "outstanding",
    "repayment",
    "arrears",
    "interest",
    "deduction",
    "owing",
  ],
};

function normalise(header: string): string {
  return header
    .toLowerCase()
    .replace(/[._/\\-]+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Best guess per field, or null where nothing resolved confidently.
 *
 * Three rules, in order of authority. An exact synonym match wins outright. Failing that, a header
 * that *contains* a synonym counts, which is what catches "IPPIS Number (new)" and "Savings
 * Balance ₦" — but only if the header is not disqualified for that field, and among the survivors
 * the **longest** matching synonym wins rather than the leftmost column.
 *
 * That last rule is the one that matters on a real sheet. "Contributions To Date" and "Loan
 * Balance" both contain a savings synonym; matching on length picks the thirteen-character
 * "contributions" over the seven-character "balance" wherever the two sit relative to each other,
 * so the answer no longer depends on which column a cooperative happened to put first.
 *
 * Anything vaguer is left for the admin to map by hand. A wrong guess silently applied is worse
 * than an empty dropdown, and on the savings column it is worse than that: it would import
 * somebody's debt as their savings.
 */
export function guessMapping(headers: string[]): Record<RosterField, number | null> {
  const normalised = headers.map(normalise);
  const taken = new Set<number>();
  const mapping = {} as Record<RosterField, number | null>;

  for (const field of ROSTER_FIELD_ORDER) {
    const synonyms = SYNONYMS[field];
    const disqualifiers = DISQUALIFIERS[field];

    let index = normalised.findIndex(
      (header, position) => !taken.has(position) && synonyms.includes(header),
    );

    if (index < 0) {
      let bestScore = 0;

      normalised.forEach((header, position) => {
        if (taken.has(position) || header.length <= 2) return;
        if (disqualifiers.some((word) => header.includes(word))) return;

        const score = synonyms
          .filter((synonym) => header.includes(synonym))
          .reduce((longest, synonym) => Math.max(longest, synonym.length), 0);

        if (score > bestScore) {
          bestScore = score;
          index = position;
        }
      });
    }

    mapping[field] = index >= 0 ? index : null;
    if (index >= 0) taken.add(index);
  }

  return mapping;
}

export type RowStatus = "ready" | "needs_review" | "invalid";

export type PreparedRow = {
  index: number;
  employeeId: string;
  name: string | null;
  savingsBalance: number;
  status: RowStatus;
  /** Why it is not ready. Empty when it is. */
  issues: string[];
};

export type PrepareOptions = {
  /** `organizations.employee_id_pattern` — the same rule employee onboarding validates against. */
  employeeIdPattern: string;
};

/**
 * Validates every row against the mapping, and flags duplicates within the file itself.
 *
 * "Needs review" and "invalid" are deliberately different: a row with no savings figure is
 * probably a member with no savings yet and imports fine at zero, while a row with no staff ID
 * cannot be matched to anybody, ever, and is excluded rather than guessed at.
 */
export function prepareRows(
  rows: string[][],
  mapping: Record<RosterField, number | null>,
  options: PrepareOptions,
): PreparedRow[] {
  const pattern = safePattern(options.employeeIdPattern);
  const seen = new Map<string, number>();

  return rows.map((row, index) => {
    const issues: string[] = [];

    const rawEmployeeId = readCell(row, mapping.employeeId);
    const employeeId = rawEmployeeId.replace(/\s+/g, "");
    const name = readCell(row, mapping.name) || null;
    const rawBalance = readCell(row, mapping.savingsBalance);

    if (!employeeId) {
      issues.push("No staff ID, so this row cannot be matched to anybody.");
    } else if (pattern && !pattern.test(employeeId)) {
      issues.push("This staff ID does not match the format FMC Abeokuta uses.");
    }

    const previous = employeeId ? seen.get(employeeId) : undefined;
    if (employeeId && previous !== undefined) {
      issues.push(`The same staff ID appears on row ${previous + 1}.`);
    } else if (employeeId) {
      seen.set(employeeId, index);
    }

    const savingsBalance = parseAmount(rawBalance);
    if (rawBalance && savingsBalance === null) {
      issues.push("That savings figure is not a number.");
    }

    if (!name) issues.push("No name — the member will show as their staff ID alone.");

    const fatal = issues.some(
      (issue) =>
        issue.startsWith("No staff ID") ||
        issue.startsWith("The same staff ID") ||
        issue.startsWith("This staff ID") ||
        issue.startsWith("That savings figure"),
    );

    return {
      index,
      employeeId,
      name,
      savingsBalance: savingsBalance ?? 0,
      status: fatal ? "invalid" : issues.length > 0 ? "needs_review" : "ready",
      issues,
    };
  });
}

/** Two source columns pointed at one Clarix field — flagged rather than silently resolved. */
export function duplicateMappings(mapping: Record<RosterField, number | null>): RosterField[] {
  const used = new Map<number, RosterField[]>();

  for (const field of ROSTER_FIELD_ORDER) {
    const index = mapping[field];
    if (index === null) continue;
    used.set(index, [...(used.get(index) ?? []), field]);
  }

  return [...used.values()].filter((fields) => fields.length > 1).flat();
}

export function countByStatus(rows: PreparedRow[]): Record<RowStatus, number> {
  return rows.reduce(
    (totals, row) => ({ ...totals, [row.status]: totals[row.status] + 1 }),
    { ready: 0, needs_review: 0, invalid: 0 } as Record<RowStatus, number>,
  );
}

function readCell(row: string[], index: number | null): string {
  if (index === null) return "";
  return (row[index] ?? "").trim();
}

/** "₦120,000.50" and "120000.5" both mean the same thing to a cooperative's treasurer. */
export function parseAmount(raw: string): number | null {
  if (!raw.trim()) return 0;

  const cleaned = raw.replace(/[₦,\s]/g, "");
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;

  return Math.round(value * 100) / 100;
}

function safePattern(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch {
    // A malformed organization pattern must not reject every row: fall back to accepting any
    // non-empty ID, which the caller has already required.
    return null;
  }
}
