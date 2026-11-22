import { describe, expect, it } from "vitest";
import {
  availableWithout,
  holdsCapacity,
  isAwaitingDecision,
  isLapsedReservation,
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
