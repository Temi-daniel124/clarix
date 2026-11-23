import { describe, expect, it } from "vitest";
import { buildSavingsTrend } from "./savings-trend";

describe("buildSavingsTrend (walkthrough 1.4d item 2)", () => {
  const ledger = [
    { type: "contribution", amount: "10000", recorded_at: "2026-08-12T09:00:00Z" },
    { type: "contribution", amount: "12000", recorded_at: "2026-09-12T09:00:00Z" },
    { type: "withdrawal_record", amount: "4000", recorded_at: "2026-09-20T09:00:00Z" },
    { type: "loan_repayment", amount: "25000", recorded_at: "2026-10-01T09:00:00Z" },
    { type: "contribution", amount: "12000", recorded_at: "2026-10-12T09:00:00Z" },
  ];

  it("ends on the balance the card shows, however much was imported before the ledger began", () => {
    const points = buildSavingsTrend(ledger, 594_000);
    expect(points.map((point) => point.at)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(points.at(-1)?.value).toBe(594_000);
  });

  it("changes by what really moved after the first month, never more than the balance", () => {
    const points = buildSavingsTrend(ledger, 594_000);
    const change = points.at(-1)!.value - points[0].value;
    // September +12,000 − 4,000 and October +12,000; the loan repayment is not savings.
    expect(change).toBe(20_000);
    expect(change).toBeLessThanOrEqual(594_000);
  });

  it("shows no trend with under two months of history", () => {
    expect(buildSavingsTrend(ledger.slice(0, 1), 10_000)).toEqual([]);
  });
});
