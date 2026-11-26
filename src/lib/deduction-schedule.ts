/**
 * When a running loan's next deduction is expected (BUILD-PLAN 1.4e item 3).
 *
 * Deductions fall monthly on the loan's schedule: the same day of the month as the last recorded
 * repayment, or as the approval if nothing has been recorded yet. The next one is the first date
 * on that schedule from today on, never a date already past, which is what "one month after the
 * last recorded repayment" showed once a cooperative fell behind with its records. Past the
 * loan's end there is nothing to expect, and the line is left out.
 *
 * Still an expectation, never a fact: Clarix has no payroll connection (D005).
 */

function addMonths(date: Date, months: number): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  // Keep the schedule's day, clamped to the month's last day (31 Jan → 28 Feb → 31 Mar).
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return result;
}

/** The first scheduled date on or after `now`'s calendar day (UTC midnight). */
function startOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function nextDeductionOn({
  anchor,
  approvedAt,
  tenureMonths,
  expectedEndDate,
  now = new Date(),
}: {
  /** The last recorded repayment, or the approval when none is recorded. */
  anchor: string | null;
  approvedAt: string | null;
  tenureMonths: number;
  /** For a loan entered as already running (D036), the end staff recorded. */
  expectedEndDate: string | null;
  now?: Date;
}): string | null {
  if (!anchor) return null;
  const start = new Date(anchor);
  if (Number.isNaN(start.getTime())) return null;

  const end = expectedEndDate
    ? new Date(expectedEndDate)
    : approvedAt
      ? addMonths(new Date(approvedAt), tenureMonths)
      : null;

  const today = startOfDay(now);
  for (let months = 1; months <= 1200; months += 1) {
    const candidate = addMonths(start, months);
    if (end && startOfDay(candidate) > startOfDay(end)) return null;
    if (startOfDay(candidate) >= today) return candidate.toISOString();
  }
  return null;
}
