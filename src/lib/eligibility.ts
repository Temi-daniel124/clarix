/**
 * Deduction-capacity arithmetic — docs/DATA-MODEL.md § "Eligibility & reservation", Steps 1
 * and 2.
 *
 * Deliberately boring, deliberately pure, deliberately in one place. DECISIONS.md D018: this
 * is the eligibility decision, and it is arithmetic against an agreed policy — never a model
 * output, never inferred, always reproducible from the same inputs. Anything that shows a
 * capacity figure anywhere in the product calls these functions rather than recomputing the
 * formula locally.
 *
 * Step 3, the reservation, is not here: it is a database transaction taking an advisory lock
 * (DECISIONS.md D008) and cannot be expressed as a pure function.
 */

export type DeductionBasis = "gross" | "net";

export type DeductionPolicy = {
  /** organizations.deduction_basis — DECISIONS.md D007, default 'gross'. */
  basis: DeductionBasis;
  /** organizations.deduction_max_percentage — e.g. 33.3 for the Labour Act §5 cap. */
  maxPercentage: number;
};

export type SalaryBasis = {
  gross: number | null;
  net: number | null;
};

export type Capacity = {
  /** The monthly deduction ceiling: the salary basis amount times the maximum percentage. */
  cap: number;
  /** Monthly repayments already reserved or active, summed across every cooperative. */
  committed: number;
  /** What is left. Never negative: an over-committed employee has zero capacity, not less. */
  available: number;
};

export type EligibilityPreview = Capacity & {
  requestedMonthlyRepayment: number;
  eligible: boolean;
  /** How far past the cap the request would go. Zero when eligible. */
  shortfall: number;
  /** What would remain if the request went ahead. Zero when not eligible. */
  headroom: number;
};

/** The figure the cap is calculated against, per the organization's configured basis. */
export function salaryBasisAmount(salary: SalaryBasis, basis: DeductionBasis): number {
  const amount = basis === "gross" ? salary.gross : salary.net;
  return amount && amount > 0 ? amount : 0;
}

/**
 * Step 1 — compute available capacity. Read-only and safe to run at any time, which is what
 * makes the cross-cooperative lookup available outside an active loan submission
 * (DECISIONS.md D003).
 */
export function computeCapacity({
  salary,
  policy,
  committedMonthlyRepayments,
  capOverride,
}: {
  salary: SalaryBasis;
  policy: DeductionPolicy;
  /** Every reserved or active monthly repayment the employee holds, across all cooperatives. */
  committedMonthlyRepayments: number;
  /**
   * A cap already computed elsewhere — in practice the one `capacity_for_user` returned.
   *
   * The screens receive the cap from the database, because only the database can sum committed
   * obligations across cooperatives. Passing it through rather than recomputing salary maths in
   * the browser keeps a single source of truth for the figure, while this module stays the
   * single source of truth for the arithmetic around it.
   */
  capOverride?: number;
}): Capacity {
  const basisAmount = salaryBasisAmount(salary, policy.basis);
  const cap =
    capOverride !== undefined && capOverride >= 0
      ? round2(capOverride)
      : round2((basisAmount * policy.maxPercentage) / 100);
  const committed = round2(Math.max(0, committedMonthlyRepayments));

  return {
    cap,
    committed,
    available: round2(Math.max(0, cap - committed)),
  };
}

/**
 * Step 2 — preview a hypothetical repayment against that capacity. No side effect: nothing is
 * reserved, nothing is written, and it is safe to call on every keystroke of a slider.
 */
export function previewEligibility({
  salary,
  policy,
  committedMonthlyRepayments,
  requestedMonthlyRepayment,
  capOverride,
}: {
  salary: SalaryBasis;
  policy: DeductionPolicy;
  committedMonthlyRepayments: number;
  requestedMonthlyRepayment: number;
  capOverride?: number;
}): EligibilityPreview {
  const capacity = computeCapacity({ salary, policy, committedMonthlyRepayments, capOverride });
  const requested = round2(Math.max(0, requestedMonthlyRepayment));
  const eligible = requested <= capacity.available;

  return {
    ...capacity,
    requestedMonthlyRepayment: requested,
    eligible,
    shortfall: eligible ? 0 : round2(requested - capacity.available),
    headroom: eligible ? round2(capacity.available - requested) : 0,
  };
}

/**
 * The reservation window for a cooperative: its own override when it has set one, otherwise
 * the organization default. DECISIONS.md D009 — an override may only ever be shorter, which
 * the database enforces at write time; this clamp is the belt to that braces.
 */
export function reservationExpiryDays({
  organizationDefault,
  cooperativeOverride,
}: {
  organizationDefault: number;
  cooperativeOverride: number | null;
}): number {
  if (cooperativeOverride === null) return organizationDefault;
  return Math.min(cooperativeOverride, organizationDefault);
}

/** Naira to the kobo. Keeps repeated arithmetic from drifting in the last decimal place. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
