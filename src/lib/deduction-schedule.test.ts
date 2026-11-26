import { describe, expect, it } from "vitest";
import { nextDeductionOn } from "./deduction-schedule";

const NOW = new Date("2026-11-23T12:00:00Z");
const day = (iso: string | null) => iso?.slice(0, 10) ?? null;

describe("nextDeductionOn (BUILD-PLAN 1.4e item 3)", () => {
  it("is the next date on the loan's monthly schedule, never one already past", () => {
    // Last repayment recorded in June: one month after it (July) is long gone.
    const next = nextDeductionOn({
      anchor: "2026-06-25T09:00:00Z",
      approvedAt: "2026-03-25T09:00:00Z",
      tenureMonths: 24,
      expectedEndDate: null,
      now: NOW,
    });
    expect(day(next)).toBe("2026-11-25");
  });

  it("rolls to next month when this month's date has passed", () => {
    expect(
      day(nextDeductionOn({ anchor: "2026-10-10T09:00:00Z", approvedAt: "2026-10-10T09:00:00Z", tenureMonths: 12, expectedEndDate: null, now: NOW })),
    ).toBe("2026-12-10");
  });

  it("keeps a month-end schedule on the last day of shorter months", () => {
    expect(
      day(nextDeductionOn({ anchor: "2027-01-31T09:00:00Z", approvedAt: "2027-01-31T09:00:00Z", tenureMonths: 12, expectedEndDate: null, now: new Date("2027-02-01T00:00:00Z") })),
    ).toBe("2027-02-28");
  });

  it("expects nothing once the loan's schedule has ended", () => {
    expect(
      nextDeductionOn({ anchor: "2025-01-15T09:00:00Z", approvedAt: "2025-01-15T09:00:00Z", tenureMonths: 6, expectedEndDate: null, now: NOW }),
    ).toBeNull();
    expect(
      nextDeductionOn({ anchor: "2026-01-15T09:00:00Z", approvedAt: null, tenureMonths: 0, expectedEndDate: "2026-10-01", now: NOW }),
    ).toBeNull();
  });

  it("expects nothing without a date to schedule from", () => {
    expect(nextDeductionOn({ anchor: null, approvedAt: null, tenureMonths: 12, expectedEndDate: null, now: NOW })).toBeNull();
  });
});
