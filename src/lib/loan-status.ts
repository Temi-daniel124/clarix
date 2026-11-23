/**
 * What a loan's stored status means on screen. One definition, so the member's loans, the staff
 * queue, the homes and the review screen cannot disagree (DESIGN_SYSTEM.md §11: one source per
 * figure).
 *
 * Two different questions, and a `pending_review` loan answers them differently from a
 * reservation (DECISIONS.md D040):
 *
 *   - Is it waiting on a decision? A live reservation is, and so is a pending_review application.
 *   - Does it hold any of the member's limit? A live reservation does; a pending_review one never
 *     does. Only active loans and unexpired reservations count in committed, exactly as the
 *     database's `capacity_core()` counts them.
 */

export type LoanStatusRecord = {
  status: string;
  /** ISO timestamp, or null. Only a reservation carries one. */
  reservationExpiresAt: string | null;
};

function isLiveReservation(loan: LoanStatusRecord, now: number): boolean {
  return (
    loan.status === "reserved" &&
    loan.reservationExpiresAt !== null &&
    new Date(loan.reservationExpiresAt).getTime() > now
  );
}

/** A reservation whose hold has run out with nobody deciding it. */
export function isLapsedReservation(loan: LoanStatusRecord, now: number = Date.now()): boolean {
  return (
    loan.status === "reserved" &&
    loan.reservationExpiresAt !== null &&
    new Date(loan.reservationExpiresAt).getTime() <= now
  );
}

/** Waiting on the cooperative: a live reservation, or an above-limit application (D040). */
export function isAwaitingDecision(loan: LoanStatusRecord, now: number = Date.now()): boolean {
  return loan.status === "pending_review" || isLiveReservation(loan, now);
}

/** Counted in the member's committed total: active, or a reservation that has not lapsed. */
export function holdsCapacity(loan: LoanStatusRecord, now: number = Date.now()): boolean {
  return loan.status === "active" || isLiveReservation(loan, now);
}

/**
 * What the member could carry without this application: the figure a decision is measured
 * against. A live reservation is already inside `committed`, so it comes back out; a
 * pending_review application never went in. A decided loan is left as the database counts it.
 */
export function availableWithout(
  capacity: { cap: number; committed: number },
  loan: LoanStatusRecord & { monthlyRepayment: number },
  now: number = Date.now(),
): { availableBefore: number; committedElsewhere: number; overCap: boolean } {
  const inCommitted = isLiveReservation(loan, now);
  const committedElsewhere = Math.max(
    capacity.committed - (inCommitted ? loan.monthlyRepayment : 0),
    0,
  );
  const availableBefore = Math.max(capacity.cap - committedElsewhere, 0);

  return {
    availableBefore,
    committedElsewhere,
    overCap: loan.monthlyRepayment > availableBefore,
  };
}

/**
 * What is left on a loan, and how far through it the member is.
 *
 * A Clarix loan starts at its full amount. A loan entered as already running (D036, origin
 * 'pre_existing') starts at what was still owed on the day it was entered: the difference between
 * that and the original amount was repaid before Clarix, and counts as progress, not as debt.
 */
export function loanBalance(loan: {
  requestedAmount: number;
  /** Set only for a pre_existing loan. */
  outstandingAtEntry: number | null;
  /** Repayments recorded in Clarix against this loan. */
  repaid: number;
}): { remaining: number; progress: number } {
  const principal = loan.requestedAmount;
  const owedAtStart = loan.outstandingAtEntry ?? principal;
  const paidBefore = Math.max(principal - owedAtStart, 0);
  const remaining = Math.max(owedAtStart - loan.repaid, 0);
  const progress = principal > 0 ? Math.min(1, (paidBefore + loan.repaid) / principal) : 0;

  return { remaining, progress };
}

/**
 * The default "expected end month" for an existing loan (documents blueprint §3): as many monthly
 * repayments as the balance needs, counted from the start month or this month, whichever is later,
 * because what is still owed is repaid from now on, not from when the loan began.
 *
 * Months are "YYYY-MM". Returns null until both figures are usable.
 */
export function defaultEndMonth(input: {
  startMonth: string;
  outstanding: number;
  monthly: number;
  today?: Date;
}): string | null {
  const start = parseMonth(input.startMonth);
  if (!start || !(input.outstanding > 0) || !(input.monthly > 0)) return null;

  const today = input.today ?? new Date();
  const thisMonth = { year: today.getFullYear(), month: today.getMonth() + 1 };
  const from = compareMonths(start, thisMonth) > 0 ? start : thisMonth;
  const repayments = Math.ceil(input.outstanding / input.monthly);

  return formatMonth(addMonths(from, repayments - 1));
}

/** Number of monthly repayments from one month to another, both included. */
export function monthsInclusive(startMonth: string, endMonth: string): number | null {
  const start = parseMonth(startMonth);
  const end = parseMonth(endMonth);
  if (!start || !end) return null;
  return (end.year - start.year) * 12 + (end.month - start.month) + 1;
}

type Month = { year: number; month: number };

function parseMonth(value: string): Month | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year, month } : null;
}

function addMonths(from: Month, count: number): Month {
  const index = from.year * 12 + (from.month - 1) + count;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function compareMonths(a: Month, b: Month): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

function formatMonth(value: Month): string {
  return `${value.year}-${String(value.month).padStart(2, "0")}`;
}

/**
 * The loan figures every screen shows about one member (walkthrough 1.4d item 1): how many loans
 * are running, and what is committed against their limit each month. The member home, the member's
 * Loans screen and the cooperative's Members list all call this, over rows from `loadLoanRows`.
 */
export function summariseLoans(
  loans: Array<LoanStatusRecord & { monthlyRepayment: number }>,
  now: number = Date.now(),
): { activeCount: number; committedMonthly: number; total: number } {
  let activeCount = 0;
  let committedMonthly = 0;
  for (const loan of loans) {
    if (loan.status === "active") activeCount += 1;
    if (holdsCapacity(loan, now)) committedMonthly += loan.monthlyRepayment;
  }
  return { activeCount, committedMonthly: Math.round(committedMonthly * 100) / 100, total: loans.length };
}
