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
