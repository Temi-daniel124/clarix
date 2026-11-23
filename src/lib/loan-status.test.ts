import { describe, expect, it } from "vitest";
import {
  availableWithout,
  defaultEndMonth,
  holdsCapacity,
  isAwaitingDecision,
  isLapsedReservation,
  loanBalance,
  monthsInclusive,
} from "./loan-status";

/**
 * D040: a pending_review application waits on the cooperative like a reservation does, but holds
 * none of the member's limit. These mirror what `capacity_core()` and pgTAP suite 014 assert in
 * the database, so the screens and the arithmetic agree.
 */

const NOW = new Date("2026-11-22T12:00:00Z").getTime();
const LATER = "2026-11-29T12:00:00Z";
const EARLIER = "2026-11-20T12:00:00Z";

const reserved = { status: "reserved", reservationExpiresAt: LATER };
const lapsed = { status: "reserved", reservationExpiresAt: EARLIER };
const pendingReview = { status: "pending_review", reservationExpiresAt: null };
const active = { status: "active", reservationExpiresAt: null };
const rejected = { status: "rejected", reservationExpiresAt: null };

describe("isAwaitingDecision", () => {
  it("includes a live reservation", () => {
    expect(isAwaitingDecision(reserved, NOW)).toBe(true);
  });

  it("includes a pending_review application, which has no expiry at all", () => {
    expect(isAwaitingDecision(pendingReview, NOW)).toBe(true);
  });

  it("excludes a lapsed reservation and anything already decided", () => {
    expect(isAwaitingDecision(lapsed, NOW)).toBe(false);
    expect(isAwaitingDecision(active, NOW)).toBe(false);
    expect(isAwaitingDecision(rejected, NOW)).toBe(false);
  });
});

describe("holdsCapacity", () => {
  it("counts active loans and live reservations", () => {
    expect(holdsCapacity(active, NOW)).toBe(true);
    expect(holdsCapacity(reserved, NOW)).toBe(true);
  });

  it("never counts a pending_review application (D040)", () => {
    expect(holdsCapacity(pendingReview, NOW)).toBe(false);
  });

  it("stops counting a reservation once its hold has lapsed", () => {
    expect(holdsCapacity(lapsed, NOW)).toBe(false);
  });
});

describe("isLapsedReservation", () => {
  it("is true only for a reservation past its expiry", () => {
    expect(isLapsedReservation(lapsed, NOW)).toBe(true);
    expect(isLapsedReservation(reserved, NOW)).toBe(false);
    expect(isLapsedReservation(pendingReview, NOW)).toBe(false);
  });
});

describe("availableWithout", () => {
  const capacity = { cap: 83_250, committed: 50_000 };

  it("takes a live reservation back out of committed, because it is in there", () => {
    expect(availableWithout(capacity, { ...reserved, monthlyRepayment: 50_000 }, NOW)).toEqual({
      availableBefore: 83_250,
      committedElsewhere: 0,
      overCap: false,
    });
  });

  it("leaves committed alone for a pending_review application, which never went in", () => {
    expect(availableWithout(capacity, { ...pendingReview, monthlyRepayment: 100_000 }, NOW)).toEqual({
      availableBefore: 33_250,
      committedElsewhere: 50_000,
      overCap: true,
    });
  });

  it("treats a member with no limit as having nothing available", () => {
    expect(
      availableWithout({ cap: 0, committed: 0 }, { ...pendingReview, monthlyRepayment: 10_000 }, NOW),
    ).toEqual({ availableBefore: 0, committedElsewhere: 0, overCap: true });
  });

  it("never reports a negative figure when committed is already past the cap", () => {
    expect(
      availableWithout({ cap: 83_250, committed: 150_000 }, { ...pendingReview, monthlyRepayment: 10_000 }, NOW)
        .availableBefore,
    ).toBe(0);
  });
});


describe("loanBalance", () => {
  it("counts a Clarix loan from its full amount", () => {
    expect(loanBalance({ requestedAmount: 600_000, outstandingAtEntry: null, repaid: 150_000 })).toEqual({
      remaining: 450_000,
      progress: 0.25,
    });
  });

  it("counts an existing loan from what was owed when it was entered", () => {
    // ₦450,000 originally, ₦300,000 still owed on entry, ₦50,000 recorded since.
    expect(loanBalance({ requestedAmount: 450_000, outstandingAtEntry: 300_000, repaid: 50_000 })).toEqual({
      remaining: 250_000,
      progress: 200_000 / 450_000,
    });
  });

  it("with no original amount, the balance at entry is the whole loan", () => {
    expect(loanBalance({ requestedAmount: 300_000, outstandingAtEntry: 300_000, repaid: 0 })).toEqual({
      remaining: 300_000,
      progress: 0,
    });
  });

  it("never goes below zero", () => {
    expect(loanBalance({ requestedAmount: 100_000, outstandingAtEntry: 50_000, repaid: 80_000 }).remaining).toBe(0);
  });
});

describe("defaultEndMonth", () => {
  const today = new Date("2026-11-23T12:00:00Z");

  it("counts the repayments still needed from this month when the loan began earlier", () => {
    // ₦300,000 at ₦25,000 is 12 repayments: Nov 2026 to Oct 2027.
    expect(defaultEndMonth({ startMonth: "2025-06", outstanding: 300_000, monthly: 25_000, today })).toBe("2027-10");
  });

  it("rounds a part repayment up to a whole month", () => {
    expect(defaultEndMonth({ startMonth: "2026-11", outstanding: 100_000, monthly: 30_000, today })).toBe("2027-02");
  });

  it("is this month when one repayment clears it", () => {
    expect(defaultEndMonth({ startMonth: "2026-01", outstanding: 20_000, monthly: 25_000, today })).toBe("2026-11");
  });

  it("waits for usable figures", () => {
    expect(defaultEndMonth({ startMonth: "", outstanding: 300_000, monthly: 25_000, today })).toBeNull();
    expect(defaultEndMonth({ startMonth: "2026-01", outstanding: 0, monthly: 25_000, today })).toBeNull();
  });
});

describe("monthsInclusive", () => {
  it("counts both ends", () => {
    expect(monthsInclusive("2025-06", "2026-12")).toBe(19);
    expect(monthsInclusive("2026-01", "2026-01")).toBe(1);
  });
});
