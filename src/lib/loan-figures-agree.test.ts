import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Walkthrough 1.4d item 1: the member home, the member's Loans screen and the cooperative's
 * Members list must show the same loans and the same committed figure for one member.
 *
 * The fake database below behaves like the shared Preview database before the existing-loans
 * migration: selecting `origin` fails with 42703. That is exactly what made the member's screens
 * say "no loans" while the cooperative's list said "2 active".
 */

const MEMBER = "user-adebayo";
const COOP = "coop-1";
const MEMBERSHIP = "membership-adebayo";
const FUTURE = new Date(Date.now() + 5 * 86_400_000).toISOString();
const PAST = new Date(Date.now() - 5 * 86_400_000).toISOString();

const LOANS = [
  // Two running loans: one applied for through Clarix, one seeded as already running.
  { id: "l1", status: "active", monthly_repayment: "25000.00", reservation_expires_at: null },
  { id: "l2", status: "active", monthly_repayment: "20975.00", reservation_expires_at: null },
  // Holds capacity while it waits: counts in committed, not in active.
  { id: "l3", status: "reserved", monthly_repayment: "15000.00", reservation_expires_at: FUTURE },
  // A hold that has run out, an above-limit application and a repaid loan: none of them commit.
  { id: "l4", status: "reserved", monthly_repayment: "9000.00", reservation_expires_at: PAST },
  { id: "l5", status: "pending_review", monthly_repayment: "40000.00", reservation_expires_at: null },
  { id: "l6", status: "completed", monthly_repayment: "5000.00", reservation_expires_at: null },
].map((loan, index) => ({
  membership_id: MEMBERSHIP,
  requested_amount: "300000.00",
  tenure_months: 12,
  reserved_at: null,
  approved_at: loan.status === "active" ? PAST : null,
  rejected_at: null,
  completed_at: loan.status === "completed" ? PAST : null,
  created_at: new Date(Date.now() - index * 86_400_000).toISOString(),
  ...loan,
}));

type Result = { data: unknown; error: { code: string; message: string } | null };
let loanSelects: string[] = [];
let loanError: Result["error"] = null;

function rowsFor(table: string, columns: string): Result {
  if (table === "loans") {
    loanSelects.push(columns);
    if (loanError) return { data: null, error: loanError };
    if (columns.includes("origin")) {
      return { data: null, error: { code: "42703", message: 'column loans.origin does not exist' } };
    }
    return { data: LOANS, error: null };
  }
  if (table === "cooperative_memberships") {
    return {
      data: [
        {
          id: MEMBERSHIP,
          cooperative_id: COOP,
          status: "active",
          savings_balance: "594000.00",
          joined_at: PAST,
          user_id: MEMBER,
          users: { name: "Adebayo Ogunleye", employee_id: "214508" },
          cooperatives: { name: "Unity Staff Cooperative" },
        },
      ],
      error: null,
    };
  }
  return { data: [], error: null };
}

function fakeClient() {
  return {
    from(table: string) {
      let columns = "";
      const chain = {
        select(next: string) {
          columns = next;
          return chain;
        },
        eq: () => chain,
        in: () => chain,
        order: () => chain,
        then(resolve: (value: Result) => unknown) {
          return Promise.resolve(rowsFor(table, columns)).then(resolve);
        },
      };
      return chain;
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => fakeClient(),
  getRequestUser: async () => ({ id: MEMBER }),
}));

const { loadLoans } = await import("@/lib/supabase/loans-data");
const { loadMembers } = await import("@/lib/supabase/admin-members");
const { summariseLoans } = await import("@/lib/loan-status");

beforeEach(() => {
  loanSelects = [];
  loanError = null;
});

describe("one member's loans, on all three screens", () => {
  it("agree on the number of active loans and the committed figure", async () => {
    const memberLoans = await loadLoans();
    // Member home and member Loans both summarise the member's own rows.
    const home = summariseLoans(memberLoans);
    const loansScreen = summariseLoans(memberLoans);
    // Admin Members list, for the same membership.
    const [row] = (await loadMembers(COOP)).filter((entry) => entry.membershipId === MEMBERSHIP);

    expect(home.activeCount).toBe(2);
    expect(loansScreen.activeCount).toBe(2);
    expect(row.activeLoans).toBe(2);

    // ₦25,000 + ₦20,975 running, plus the ₦15,000 live hold: what capacity_core() counts.
    expect(home.committedMonthly).toBe(60_975);
    expect(loansScreen.committedMonthly).toBe(home.committedMonthly);
  });

  it("shows the member every loan, not an empty list, on a database without the 0.3 columns", async () => {
    const memberLoans = await loadLoans();
    expect(memberLoans).toHaveLength(LOANS.length);
    expect(loanSelects[0]).toContain("origin");
    expect(loanSelects[1]).not.toContain("origin");
    expect(memberLoans.every((loan) => loan.preExisting === false)).toBe(true);
  });

  it("fails loudly on any other database error instead of saying there are no loans", async () => {
    loanError = { code: "42501", message: "permission denied" };
    await expect(loadLoans()).rejects.toThrow("Could not load loans");
  });
});
