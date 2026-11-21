/**
 * Pricing, per D037: per active member per month, with a minimum, a trial, a grace period and
 * a yearly plan that pays for ten months.
 */

export const PRICE_PER_ACTIVE_MEMBER_NGN = 150;
export const MINIMUM_MONTHLY_BILL_NGN = 5000;
export const TRIAL_DAYS = 60;
export const GRACE_DAYS = 14;
export const YEARLY_MONTHS_CHARGED = 10;

const MAX_MEMBERS = 100_000;

export type BillingCycle = "monthly" | "yearly";

/** Turns whatever a form field holds into a safe, non-negative whole member count. */
export function normaliseMemberCount(input: unknown): number {
  let n: number;
  if (typeof input === "number") n = input;
  else if (typeof input === "string") {
    const trimmed = input.trim();
    n = trimmed === "" ? NaN : Number(trimmed);
  } else n = NaN;
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_MEMBERS, Math.floor(n));
}

/** The minimum applies per month, before any yearly multiplication. */
export function estimateBill(
  activeMembers: number,
  cycle: BillingCycle,
): { monthly: number; total: number; minimumApplied: boolean } {
  const members = normaliseMemberCount(activeMembers);
  const raw = members * PRICE_PER_ACTIVE_MEMBER_NGN;
  const minimumApplied = raw < MINIMUM_MONTHLY_BILL_NGN;
  const monthly = minimumApplied ? MINIMUM_MONTHLY_BILL_NGN : raw;
  const total = cycle === "yearly" ? monthly * YEARLY_MONTHS_CHARGED : monthly;
  return { monthly, total, minimumApplied };
}

// Reused from format.ts so naira reads the same everywhere ("₦1,248,500", no decimals).
export { formatNaira } from "./format";
