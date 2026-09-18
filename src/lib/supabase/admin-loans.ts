import { createClient } from "@/lib/supabase/server";

/**
 * Reads behind Loan Management, admin blueprint Part 6.
 *
 * Everything here is scoped by the `loans_select_staff` policy from migration 006: a cooperative's
 * staff see their own cooperative's loans because the policy says so. The membership join below
 * is how each loan gets a name attached, not what limits the set.
 */

export type LoanApplication = {
  id: string;
  membershipId: string;
  memberName: string | null;
  employeeId: string | null;
  requestedAmount: number;
  monthlyRepayment: number;
  tenureMonths: number;
  status: string;
  createdAt: string;
  decidedAt: string | null;
  reservationExpiresAt: string | null;
  /** Days until the hold lapses. Negative once it has. */
  expiresInDays: number | null;
  waitingDays: number;
  /** What the member could carry without this application counted. */
  availableBefore: number | null;
  cap: number | null;
  committedElsewhere: number | null;
  overCap: boolean;
};

export type LoanSummaryRow = {
  id: string;
  membershipId: string;
  memberName: string | null;
  requestedAmount: number;
  monthlyRepayment: number;
  tenureMonths: number;
  repaid: number;
  remaining: number;
  approvedAt: string | null;
  nextExpected: string | null;
};

type LoanRecord = {
  id: string;
  membership_id: string;
  requested_amount: number;
  monthly_repayment: number;
  tenure_months: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  reservation_expires_at: string | null;
};

async function loansForCooperative(cooperativeId: string) {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("cooperative_memberships")
    .select("id, user_id, savings_balance, users(name, employee_id)")
    .eq("cooperative_id", cooperativeId);

  const membershipIds = (memberships ?? []).map((row) => row.id);
  if (membershipIds.length === 0) return { loans: [] as LoanRecord[], memberships: memberships ?? [] };

  const { data: loans } = await supabase
    .from("loans")
    .select(
      "id, membership_id, requested_amount, monthly_repayment, tenure_months, status, created_at, approved_at, rejected_at, completed_at, reservation_expires_at",
    )
    .in("membership_id", membershipIds)
    .order("created_at", { ascending: true });

  return { loans: (loans ?? []) as LoanRecord[], memberships: memberships ?? [] };
}

function nameOf(memberships: Awaited<ReturnType<typeof loansForCooperative>>["memberships"]) {
  const byId = new Map<string, { name: string | null; employeeId: string | null }>();

  for (const membership of memberships) {
    const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;
    byId.set(membership.id, {
      name: person?.name ?? null,
      employeeId: person?.employee_id ?? null,
    });
  }

  return byId;
}

/**
 * The applications queue (blueprint 6.1). Oldest first, "since these are waiting".
 *
 * Each row carries the eligibility picture the queue shows at a glance, which means one capacity
 * lookup per application. That is a real cost, and it is the right one: an admin scanning this
 * list is deciding which application to open first, and "does this one fit" is exactly the
 * question that decides it.
 */
export async function loadApplications(cooperativeId: string): Promise<{
  pending: LoanApplication[];
  decided: LoanApplication[];
  /**
   * Reservations whose hold has run out but which nothing has ever moved on. They are excluded
   * from `pending` because they cannot be decided any more, and they are not in `decided` because
   * their stored status still says 'reserved', which left them visible on no screen at all until
   * migration 029 gave them somewhere to go.
   */
  lapsed: LoanApplication[];
}> {
  const supabase = await createClient();
  const { loans, memberships } = await loansForCooperative(cooperativeId);
  const names = nameOf(memberships);
  const now = Date.now();

  const pendingRecords = loans.filter(
    (loan) =>
      loan.status === "reserved" &&
      loan.reservation_expires_at !== null &&
      new Date(loan.reservation_expires_at).getTime() > now,
  );

  const lapsedRecords = loans.filter(
    (loan) =>
      loan.status === "reserved" &&
      loan.reservation_expires_at !== null &&
      new Date(loan.reservation_expires_at).getTime() <= now,
  );

  const decidedRecords = loans
    .filter((loan) => ["active", "rejected", "completed", "expired"].includes(loan.status))
    .sort((a, b) => (decidedAt(b) ?? "").localeCompare(decidedAt(a) ?? ""))
    .slice(0, 25);

  const capacities = new Map<string, { cap: number; committed: number }>();

  await Promise.all(
    [...new Set(pendingRecords.map((loan) => loan.membership_id))].map(async (membershipId) => {
      const { data } = await supabase.rpc("capacity_for_membership", {
        target_membership_id: membershipId,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) capacities.set(membershipId, { cap: Number(row.cap), committed: Number(row.committed) });
    }),
  );

  const toApplication = (loan: LoanRecord, withCapacity: boolean): LoanApplication => {
    const person = names.get(loan.membership_id);
    const capacity = withCapacity ? capacities.get(loan.membership_id) : undefined;

    // The application is already counted in `committed` because it is reserved, so it comes back
    // out to answer "what could they carry without it", which is what the decision is against.
    const availableBefore = capacity
      ? Math.max(capacity.cap - (capacity.committed - Number(loan.monthly_repayment)), 0)
      : null;

    return {
      id: loan.id,
      membershipId: loan.membership_id,
      memberName: person?.name ?? null,
      employeeId: person?.employeeId ?? null,
      requestedAmount: Number(loan.requested_amount),
      monthlyRepayment: Number(loan.monthly_repayment),
      tenureMonths: loan.tenure_months,
      status: loan.status,
      createdAt: loan.created_at,
      decidedAt: decidedAt(loan),
      reservationExpiresAt: loan.reservation_expires_at,
      expiresInDays: loan.reservation_expires_at
        ? Math.floor((new Date(loan.reservation_expires_at).getTime() - now) / 86_400_000)
        : null,
      waitingDays: Math.max(
        0,
        Math.floor((now - new Date(loan.created_at).getTime()) / 86_400_000),
      ),
      availableBefore,
      cap: capacity?.cap ?? null,
      committedElsewhere: capacity
        ? Math.max(capacity.committed - Number(loan.monthly_repayment), 0)
        : null,
      overCap: availableBefore !== null && Number(loan.monthly_repayment) > availableBefore,
    };
  };

  return {
    pending: pendingRecords.map((loan) => toApplication(loan, true)),
    decided: decidedRecords.map((loan) => toApplication(loan, false)),
    lapsed: lapsedRecords.map((loan) => toApplication(loan, false)),
  };
}

/** One application, with everything blueprint 6.2 puts on screen. */
export type RepaymentEntry = {
  id: string;
  amount: number;
  recordedAt: string;
  description: string | null;
};

export async function loadApplication(loanId: string): Promise<
  | (LoanApplication & {
      savingsBalance: number;
      product: { name: string; minSavingsRatio: number; maxTenureMonths: number } | null;
      salaryConfirmed: boolean;
      /** Repayments recorded against this loan, for the progress meter blueprint 6.4 asks for. */
      repaid: number;
      repayments: RepaymentEntry[];
    })
  | null
> {
  const supabase = await createClient();

  const { data: loan } = await supabase
    .from("loans")
    .select(
      "id, membership_id, requested_amount, monthly_repayment, tenure_months, status, created_at, approved_at, rejected_at, completed_at, reservation_expires_at, loan_product_id",
    )
    .eq("id", loanId)
    .maybeSingle();

  if (!loan) return null;

  const { data: membership } = await supabase
    .from("cooperative_memberships")
    .select("id, savings_balance, users(name, employee_id, salary_verified_at)")
    .eq("id", loan.membership_id)
    .maybeSingle();

  if (!membership) return null;

  const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;

  const [{ data: capacityRows }, { data: product }] = await Promise.all([
    supabase.rpc("capacity_for_membership", { target_membership_id: loan.membership_id }),
    loan.loan_product_id
      ? supabase
          .from("cooperative_loan_products")
          .select("name, min_savings_ratio, max_tenure_months")
          .eq("id", loan.loan_product_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // The repayment history behind this loan. Read separately rather than joined, because a loan
  // still waiting on a decision has none and there is no reason to make the queue pay for it.
  const { data: repaymentRows } =
    loan.status === "active" || loan.status === "completed"
      ? await supabase
          .from("savings_transactions")
          .select("id, amount, recorded_at, description")
          .eq("loan_id", loanId)
          .eq("type", "loan_repayment")
          .order("recorded_at", { ascending: false })
      : { data: null };

  const repayments: RepaymentEntry[] = (repaymentRows ?? []).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    recordedAt: row.recorded_at,
    description: row.description,
  }));

  const repaid = repayments.reduce((total, row) => total + row.amount, 0);

  const capacityRow = Array.isArray(capacityRows) ? capacityRows[0] : capacityRows;
  const now = Date.now();

  const cap = capacityRow ? Number(capacityRow.cap) : null;
  const committed = capacityRow ? Number(capacityRow.committed) : null;
  const monthly = Number(loan.monthly_repayment);

  // Only a reservation is counted in `committed`; a loan already decided is either counted as
  // active or not at all, so taking it back out would understate what the member carries.
  const stillReserved = loan.status === "reserved";
  const availableBefore =
    cap !== null && committed !== null
      ? Math.max(cap - (stillReserved ? committed - monthly : committed), 0)
      : null;

  return {
    id: loan.id,
    membershipId: loan.membership_id,
    memberName: person?.name ?? null,
    employeeId: person?.employee_id ?? null,
    requestedAmount: Number(loan.requested_amount),
    monthlyRepayment: monthly,
    tenureMonths: loan.tenure_months,
    status: loan.status,
    createdAt: loan.created_at,
    decidedAt: decidedAt(loan as LoanRecord),
    reservationExpiresAt: loan.reservation_expires_at,
    expiresInDays: loan.reservation_expires_at
      ? Math.floor((new Date(loan.reservation_expires_at).getTime() - now) / 86_400_000)
      : null,
    waitingDays: Math.max(0, Math.floor((now - new Date(loan.created_at).getTime()) / 86_400_000)),
    availableBefore,
    cap,
    committedElsewhere:
      committed !== null ? Math.max(committed - (stillReserved ? monthly : 0), 0) : null,
    overCap: availableBefore !== null && monthly > availableBefore,
    savingsBalance: Number(membership.savings_balance ?? 0),
    salaryConfirmed: Boolean(person?.salary_verified_at),
    repaid,
    repayments,
    product: product
      ? {
          name: product.name,
          minSavingsRatio: Number(product.min_savings_ratio),
          maxTenureMonths: product.max_tenure_months,
        }
      : null,
  };
}

/** Active loans (blueprint 6.3). */
export async function loadActiveLoans(cooperativeId: string): Promise<LoanSummaryRow[]> {
  const supabase = await createClient();
  const { loans, memberships } = await loansForCooperative(cooperativeId);
  const names = nameOf(memberships);

  const active = loans.filter((loan) => loan.status === "active");
  if (active.length === 0) return [];

  const { data: repayments } = await supabase
    .from("savings_transactions")
    .select("loan_id, amount, recorded_at")
    .eq("type", "loan_repayment")
    .in(
      "loan_id",
      active.map((loan) => loan.id),
    );

  const repaidByLoan = new Map<string, { total: number; last: string | null }>();
  for (const entry of repayments ?? []) {
    if (!entry.loan_id) continue;
    const current = repaidByLoan.get(entry.loan_id) ?? { total: 0, last: null };
    repaidByLoan.set(entry.loan_id, {
      total: current.total + Number(entry.amount),
      last:
        current.last === null || entry.recorded_at > current.last ? entry.recorded_at : current.last,
    });
  }

  return active
    .map((loan) => {
      const repaid = repaidByLoan.get(loan.id) ?? { total: 0, last: null };
      const person = names.get(loan.membership_id);

      return {
        id: loan.id,
        membershipId: loan.membership_id,
        memberName: person?.name ?? null,
        requestedAmount: Number(loan.requested_amount),
        monthlyRepayment: Number(loan.monthly_repayment),
        tenureMonths: loan.tenure_months,
        repaid: repaid.total,
        remaining: Math.max(Number(loan.requested_amount) - repaid.total, 0),
        approvedAt: loan.approved_at,
        nextExpected: nextMonthAfter(repaid.last ?? loan.approved_at),
      };
    })
    .sort((a, b) => (a.memberName ?? "~").localeCompare(b.memberName ?? "~"));
}

function decidedAt(loan: LoanRecord): string | null {
  return loan.completed_at ?? loan.approved_at ?? loan.rejected_at ?? null;
}

/** The month after the last thing that happened, what payroll is expected to take next. */
function nextMonthAfter(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}
