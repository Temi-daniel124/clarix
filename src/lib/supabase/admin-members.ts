import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/format";

/**
 * Reads behind the cooperative dashboard (admin blueprint 4.1) and member management (Part 5).
 *
 * Every query is scoped by `is_active_staff(cooperative_id)` in the policies rather than by a
 * filter here — the `.eq("cooperative_id", ...)` calls below choose WHICH cooperative among the
 * ones this person may see, they are not what stops them seeing another (SECURITY.md).
 */

export type MemberRow = {
  /** A membership exists once the person has a Clarix account; until then this is roster-only. */
  membershipId: string | null;
  rosterId: string | null;
  name: string | null;
  employeeId: string | null;
  savingsBalance: number;
  activeLoans: number;
  status: "active" | "pending" | "suspended" | "not_on_clarix";
  joinedAt: string | null;
};

/**
 * Everyone this cooperative considers a member: real memberships, plus roster entries still
 * waiting for their person to sign up.
 *
 * Showing both is the honest answer to "who are my members" — a cooperative that imported 400
 * people has 400 members from its own point of view, whatever Clarix knows about them yet. The
 * two are visually distinguished rather than merged, so nobody mistakes a roster line for an
 * account.
 */
export async function loadMembers(cooperativeId: string): Promise<MemberRow[]> {
  const supabase = await createClient();

  const [{ data: memberships }, { data: roster }, { data: loans }] = await Promise.all([
    supabase
      .from("cooperative_memberships")
      .select("id, status, savings_balance, joined_at, user_id, users(name, employee_id)")
      .eq("cooperative_id", cooperativeId),
    supabase
      .from("member_roster_entries")
      .select("id, employee_id, name, savings_balance, membership_id")
      .eq("cooperative_id", cooperativeId),
    supabase.from("loans").select("membership_id, status, reservation_expires_at"),
  ]);

  const activeByMembership = new Map<string, number>();
  for (const loan of loans ?? []) {
    if (loan.status !== "active") continue;
    activeByMembership.set(
      loan.membership_id,
      (activeByMembership.get(loan.membership_id) ?? 0) + 1,
    );
  }

  const rows: MemberRow[] = (memberships ?? []).map((membership) => {
    const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;

    return {
      membershipId: membership.id,
      rosterId: null,
      name: person?.name ?? null,
      employeeId: person?.employee_id ?? null,
      savingsBalance: Number(membership.savings_balance ?? 0),
      activeLoans: activeByMembership.get(membership.id) ?? 0,
      status: membership.status,
      joinedAt: membership.joined_at,
    };
  });

  for (const entry of roster ?? []) {
    if (entry.membership_id) continue;

    rows.push({
      membershipId: null,
      rosterId: entry.id,
      name: entry.name,
      employeeId: entry.employee_id,
      savingsBalance: Number(entry.savings_balance ?? 0),
      activeLoans: 0,
      status: "not_on_clarix",
      joinedAt: null,
    });
  }

  // Unnamed rows sort last explicitly. Comparing a placeholder string instead put them first,
  // because locale-aware comparison sorts punctuation ahead of letters.
  return rows.sort((a, b) => {
    if (!a.name && !b.name) return (a.employeeId ?? "").localeCompare(b.employeeId ?? "");
    if (!a.name) return 1;
    if (!b.name) return -1;
    return a.name.localeCompare(b.name);
  });
}

export type MemberCapacity = {
  cap: number;
  committed: number;
  available: number;
};

export type MemberLoan = {
  id: string;
  requestedAmount: number;
  monthlyRepayment: number;
  tenureMonths: number;
  status: string;
  createdAt: string;
  reservationExpiresAt: string | null;
  repaid: number;
};

export type MemberLedgerEntry = {
  id: string;
  type: "contribution" | "withdrawal_record" | "loan_repayment";
  amount: number;
  description: string | null;
  recordedAt: string;
};

export type MemberProfile = {
  membershipId: string;
  cooperativeId: string;
  name: string | null;
  employeeId: string | null;
  email: string | null;
  status: string;
  joinedAt: string | null;
  savingsBalance: number;
  salaryConfirmed: boolean;
  capacity: MemberCapacity | null;
  loans: MemberLoan[];
  ledger: MemberLedgerEntry[];
};

export async function loadMemberProfile(membershipId: string): Promise<MemberProfile | null> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("cooperative_memberships")
    .select(
      "id, cooperative_id, status, savings_balance, joined_at, users(name, employee_id, email, salary_verified_at)",
    )
    .eq("id", membershipId)
    .maybeSingle();

  if (!membership) return null;

  const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;

  const [{ data: capacityRows }, { data: loans }, { data: ledger }] = await Promise.all([
    // The same calculation the member sees on their own dashboard, reached through the staff
    // door rather than reimplemented (migration 012). It returns an aggregate and nothing else:
    // never which cooperative an obligation sits with (DECISIONS.md D003).
    supabase.rpc("capacity_for_membership", { target_membership_id: membershipId }),
    supabase
      .from("loans")
      .select(
        "id, requested_amount, monthly_repayment, tenure_months, status, created_at, reservation_expires_at",
      )
      .eq("membership_id", membershipId)
      .order("created_at", { ascending: false }),
    supabase
      .from("savings_transactions")
      .select("id, type, amount, description, recorded_at, loan_id")
      .eq("membership_id", membershipId)
      .order("recorded_at", { ascending: false }),
  ]);

  const capacityRow = Array.isArray(capacityRows) ? capacityRows[0] : capacityRows;

  const repaidByLoan = new Map<string, number>();
  for (const entry of ledger ?? []) {
    if (entry.type !== "loan_repayment" || !entry.loan_id) continue;
    repaidByLoan.set(entry.loan_id, (repaidByLoan.get(entry.loan_id) ?? 0) + Number(entry.amount));
  }

  return {
    membershipId: membership.id,
    cooperativeId: membership.cooperative_id,
    name: person?.name ?? null,
    employeeId: person?.employee_id ?? null,
    email: person?.email ?? null,
    status: membership.status,
    joinedAt: membership.joined_at,
    savingsBalance: Number(membership.savings_balance ?? 0),
    salaryConfirmed: Boolean(person?.salary_verified_at),
    capacity: capacityRow
      ? {
          cap: Number(capacityRow.cap),
          committed: Number(capacityRow.committed),
          available: Number(capacityRow.available),
        }
      : null,
    loans: (loans ?? []).map((loan) => ({
      id: loan.id,
      requestedAmount: Number(loan.requested_amount),
      monthlyRepayment: Number(loan.monthly_repayment),
      tenureMonths: loan.tenure_months,
      status: loan.status,
      createdAt: loan.created_at,
      reservationExpiresAt: loan.reservation_expires_at,
      repaid: repaidByLoan.get(loan.id) ?? 0,
    })),
    ledger: (ledger ?? []).map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: Number(entry.amount),
      description: entry.description,
      recordedAt: entry.recorded_at,
    })),
  };
}

/* ---------------------------------------------------------------------------
   The dashboard — blueprint 4.1
--------------------------------------------------------------------------- */

export type AttentionItem = {
  id: string;
  kind: "application" | "roster" | "invitation";
  title: string;
  detail: string;
  href: string | null;
  /** Days this has been waiting, for the ones where waiting is the point. */
  waitingDays: number | null;
  urgent: boolean;
};

export type CooperativeSummary = {
  memberCount: number;
  rosterWaiting: number;
  savingsHeld: number;
  activeLoans: number;
  pendingApplications: number;
  monthlyDeductions: number;
  attention: AttentionItem[];
  thisMonth: { label: string; body: string }[];
  lastRecordedAt: string | null;
};

export async function loadCooperativeSummary(
  cooperativeId: string,
): Promise<CooperativeSummary> {
  const supabase = await createClient();

  const [{ data: memberships }, { data: roster }, { data: invitations }, { data: staffRoles }] =
    await Promise.all([
      supabase
        .from("cooperative_memberships")
        .select("id, status, savings_balance, joined_at, users(name, employee_id)")
        .eq("cooperative_id", cooperativeId),
      supabase
        .from("member_roster_entries")
        .select("id, employee_id, name, membership_id, imported_at")
        .eq("cooperative_id", cooperativeId),
      supabase
        .from("staff_invitations")
        .select("id, email, invited_at, claimed_at")
        .eq("cooperative_id", cooperativeId)
        .is("claimed_at", null),
      supabase
        .from("cooperative_staff_roles")
        .select("id, status, invited_at, users(name, email)")
        .eq("cooperative_id", cooperativeId)
        .eq("status", "invited"),
    ]);

  const membershipIds = (memberships ?? []).map((row) => row.id);

  const [{ data: loans }, { data: ledger }] = await Promise.all([
    membershipIds.length > 0
      ? supabase
          .from("loans")
          .select(
            "id, membership_id, status, requested_amount, monthly_repayment, created_at, reservation_expires_at",
          )
          .in("membership_id", membershipIds)
      : Promise.resolve({ data: [] as never[] }),
    membershipIds.length > 0
      ? supabase
          .from("savings_transactions")
          .select("id, membership_id, type, amount, recorded_at")
          .in("membership_id", membershipIds)
          .order("recorded_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const nameByMembership = new Map<string, string>();
  for (const membership of memberships ?? []) {
    const person = Array.isArray(membership.users) ? membership.users[0] : membership.users;
    nameByMembership.set(membership.id, person?.name ?? person?.employee_id ?? "A member");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const active = (loans ?? []).filter((loan) => loan.status === "active");
  const pending = (loans ?? []).filter(
    (loan) =>
      loan.status === "reserved" &&
      loan.reservation_expires_at !== null &&
      new Date(loan.reservation_expires_at) > now,
  );

  const attention: AttentionItem[] = [];

  for (const loan of pending) {
    const waitingDays = daysBetween(new Date(loan.created_at), now);
    const expiresIn = loan.reservation_expires_at
      ? daysBetween(now, new Date(loan.reservation_expires_at))
      : null;

    attention.push({
      id: loan.id,
      kind: "application",
      title: `${nameByMembership.get(loan.membership_id) ?? "A member"} is waiting on a decision`,
      detail:
        expiresIn !== null && expiresIn <= 2
          ? `The hold on their capacity lapses in ${expiresIn === 0 ? "under a day" : `${expiresIn} ${expiresIn === 1 ? "day" : "days"}`}.`
          : `Applied for ${formatNaira(Number(loan.requested_amount))}.`,
      // Loan Application Review (6.2) is the next block of work; until it exists this leads to
      // the member it concerns, which is the closest true thing rather than a dead link.
      href: `/admin/members/${loan.membership_id}`,
      waitingDays,
      urgent: expiresIn !== null && expiresIn <= 2,
    });
  }

  for (const entry of roster ?? []) {
    if (entry.membership_id || entry.name) continue;

    attention.push({
      id: entry.id,
      kind: "roster",
      title: `Staff ID ${entry.employee_id} was imported without a name`,
      detail: "They will show as a bare staff ID until somebody fills it in.",
      href: "/admin/members",
      waitingDays: daysBetween(new Date(entry.imported_at), now),
      urgent: false,
    });
  }

  for (const invitation of invitations ?? []) {
    const waitingDays = daysBetween(new Date(invitation.invited_at), now);
    if (waitingDays < 3) continue;

    attention.push({
      id: invitation.id,
      kind: "invitation",
      title: `${invitation.email} has not taken up their invitation`,
      detail: `Invited ${waitingDays} days ago. Nothing has reached them by email yet.`,
      href: "/admin/manage/officers",
      waitingDays,
      urgent: false,
    });
  }

  for (const role of staffRoles ?? []) {
    const waitingDays = daysBetween(new Date(role.invited_at), now);
    if (waitingDays < 3) continue;
    const person = Array.isArray(role.users) ? role.users[0] : role.users;

    attention.push({
      id: role.id,
      kind: "invitation",
      title: `${person?.name ?? person?.email ?? "An officer"} has not accepted their role`,
      detail: `Invited ${waitingDays} days ago.`,
      href: "/admin/manage/officers",
      waitingDays,
      urgent: false,
    });
  }

  attention.sort((a, b) => Number(b.urgent) - Number(a.urgent) || (b.waitingDays ?? 0) - (a.waitingDays ?? 0));

  const contributionsThisMonth = (ledger ?? [])
    .filter(
      (entry) => entry.type === "contribution" && new Date(entry.recorded_at) >= startOfMonth,
    )
    .reduce((total, entry) => total + Number(entry.amount), 0);

  const newMembersThisMonth = (memberships ?? []).filter(
    (membership) => membership.joined_at && new Date(membership.joined_at) >= startOfMonth,
  ).length;

  const applicationsThisMonth = (loans ?? []).filter(
    (loan) => new Date(loan.created_at) >= startOfMonth,
  ).length;

  const thisMonth: { label: string; body: string }[] = [
    {
      label: "Applications",
      body:
        applicationsThisMonth === 0
          ? "No loan applications this month."
          : `${applicationsThisMonth} loan ${applicationsThisMonth === 1 ? "application" : "applications"} this month.`,
    },
    {
      label: "Savings",
      body:
        contributionsThisMonth === 0
          ? "No contributions recorded this month yet."
          : `${formatNaira(contributionsThisMonth)} in contributions recorded this month.`,
    },
    {
      label: "Members",
      body:
        newMembersThisMonth === 0
          ? "No new members joined this month."
          : `${newMembersThisMonth} new ${newMembersThisMonth === 1 ? "member" : "members"} this month.`,
    },
  ];

  return {
    memberCount: (memberships ?? []).length,
    rosterWaiting: (roster ?? []).filter((entry) => !entry.membership_id).length,
    savingsHeld: (memberships ?? []).reduce(
      (total, membership) => total + Number(membership.savings_balance ?? 0),
      0,
    ),
    activeLoans: active.length,
    pendingApplications: pending.length,
    monthlyDeductions: active.reduce(
      (total, loan) => total + Number(loan.monthly_repayment ?? 0),
      0,
    ),
    attention,
    thisMonth,
    lastRecordedAt: (ledger ?? [])[0]?.recorded_at ?? null,
  };
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}
