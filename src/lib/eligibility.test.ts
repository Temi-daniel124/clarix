import { describe, expect, it } from "vitest";
import {
  computeCapacity,
  previewEligibility,
  reservationExpiryDays,
  salaryBasisAmount,
} from "./eligibility";

/**
 * Unit tests for the eligibility arithmetic, docs/DEVELOPMENT-WORKFLOW.md § 3: the formulas
 * are pure functions and get tested here, locally and in CI, with no database involved. RLS
 * behaviour and the advisory-lock reservation are tested separately with pgTAP, on the hosted
 * runner only.
 *
 * The figures below come from the real reviewed FMC Abeokuta payslip cited in PRODUCT.md and
 * DECISIONS.md D007: three named cooperative deductions running at once, summing to 30.3% of
 * gross and 58.2% of net.
 */

const POLICY = { basis: "gross", maxPercentage: 33.3 } as const;
const SALARY = { gross: 250_000, net: 180_000 };

describe("salaryBasisAmount", () => {
  it("reads the gross figure under a gross basis", () => {
    expect(salaryBasisAmount(SALARY, "gross")).toBe(250_000);
  });

  it("reads the net figure under a net basis", () => {
    expect(salaryBasisAmount(SALARY, "net")).toBe(180_000);
  });

  it("treats a missing salary as no capacity rather than throwing", () => {
    expect(salaryBasisAmount({ gross: null, net: null }, "gross")).toBe(0);
  });
});

describe("computeCapacity", () => {
  it("caps at the configured percentage of the configured basis", () => {
    const capacity = computeCapacity({
      salary: SALARY,
      policy: POLICY,
      committedMonthlyRepayments: 0,
    });

    expect(capacity.cap).toBe(83_250);
    expect(capacity.available).toBe(83_250);
  });

  it("subtracts obligations already committed across every cooperative", () => {
    const capacity = computeCapacity({
      salary: SALARY,
      policy: POLICY,
      committedMonthlyRepayments: 54_000,
    });

    expect(capacity.committed).toBe(54_000);
    expect(capacity.available).toBe(29_250);
  });

  it("floors an over-committed employee at zero rather than reporting negative capacity", () => {
    const capacity = computeCapacity({
      salary: SALARY,
      policy: POLICY,
      committedMonthlyRepayments: 120_000,
    });

    expect(capacity.available).toBe(0);
  });

  it("produces a very different answer on a net basis, which is why D007 fixes it to gross", () => {
    const onNet = computeCapacity({
      salary: SALARY,
      policy: { basis: "net", maxPercentage: 33.3 },
      committedMonthlyRepayments: 54_000,
    });

    expect(onNet.cap).toBe(59_940);
    expect(onNet.available).toBe(5_940);
  });

  it("gives no capacity at all when the salary has not been confirmed yet", () => {
    const capacity = computeCapacity({
      salary: { gross: null, net: null },
      policy: POLICY,
      committedMonthlyRepayments: 0,
    });

    expect(capacity.cap).toBe(0);
    expect(capacity.available).toBe(0);
  });
});

describe("previewEligibility", () => {
  const base = { salary: SALARY, policy: POLICY, committedMonthlyRepayments: 54_000 };

  it("approves a request that fits inside what is left", () => {
    const preview = previewEligibility({ ...base, requestedMonthlyRepayment: 18_000 });

    expect(preview.eligible).toBe(true);
    expect(preview.shortfall).toBe(0);
    expect(preview.headroom).toBe(11_250);
  });

  it("reports the exact shortfall on a request that exceeds the cap", () => {
    const preview = previewEligibility({ ...base, requestedMonthlyRepayment: 34_000 });

    expect(preview.eligible).toBe(false);
    expect(preview.shortfall).toBe(4_750);
    expect(preview.headroom).toBe(0);
  });

  it("treats a request exactly equal to the remaining capacity as eligible", () => {
    const preview = previewEligibility({ ...base, requestedMonthlyRepayment: 29_250 });

    expect(preview.eligible).toBe(true);
    expect(preview.headroom).toBe(0);
  });

  it("rejects anything at all once capacity is fully committed", () => {
    const preview = previewEligibility({
      ...base,
      committedMonthlyRepayments: 83_250,
      requestedMonthlyRepayment: 1,
    });

    expect(preview.eligible).toBe(false);
    expect(preview.shortfall).toBe(1);
  });

  it("does not mutate or reserve anything, repeated calls give the same answer", () => {
    const first = previewEligibility({ ...base, requestedMonthlyRepayment: 18_000 });
    const second = previewEligibility({ ...base, requestedMonthlyRepayment: 18_000 });

    expect(second).toEqual(first);
  });
});

describe("reservationExpiryDays", () => {
  it("uses the organization default when a cooperative sets no override", () => {
    expect(reservationExpiryDays({ organizationDefault: 7, cooperativeOverride: null })).toBe(7);
  });

  it("honours a shorter cooperative override", () => {
    expect(reservationExpiryDays({ organizationDefault: 7, cooperativeOverride: 3 })).toBe(3);
  });

  it("never lets a cooperative hold shared capacity longer than the agreed norm", () => {
    expect(reservationExpiryDays({ organizationDefault: 7, cooperativeOverride: 30 })).toBe(7);
  });
});

describe("capOverride", () => {
  it("uses a cap computed elsewhere in place of the salary calculation", () => {
    const capacity = computeCapacity({
      salary: { gross: null, net: null },
      policy: { basis: "gross", maxPercentage: 0 },
      committedMonthlyRepayments: 30_000,
      capOverride: 83_250,
    });

    expect(capacity.cap).toBe(83_250);
    expect(capacity.available).toBe(53_250);
  });

  it("previews against that cap, which is how the application screen stays instant", () => {
    // The screen holds the cap the database returned and never recomputes salary maths in the
    // browser, so moving a slider costs nothing and cannot disagree with the server.
    const preview = previewEligibility({
      salary: { gross: null, net: null },
      policy: { basis: "gross", maxPercentage: 0 },
      committedMonthlyRepayments: 30_000,
      requestedMonthlyRepayment: 60_000,
      capOverride: 83_250,
    });

    expect(preview.eligible).toBe(false);
    expect(preview.shortfall).toBe(6_750);
  });

  it("falls back to the salary calculation when no override is given", () => {
    const capacity = computeCapacity({
      salary: { gross: 250_000, net: 180_000 },
      policy: { basis: "gross", maxPercentage: 33.3 },
      committedMonthlyRepayments: 0,
    });

    expect(capacity.cap).toBe(83_250);
  });
});
