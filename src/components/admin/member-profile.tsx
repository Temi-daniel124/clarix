"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapacityMeter } from "@/components/clarix/capacity-meter";
import { IdentityMark } from "@/components/clarix/identity-mark";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import type { MemberProfile } from "@/lib/supabase/admin-members";

const TABS = ["overview", "savings", "loans", "deductions"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  savings: "Savings",
  loans: "Loans",
  deductions: "Deductions",
};

/**
 * Member Profile, staff view — admin blueprint 5.2.
 *
 * The Overview tab's eligibility panel is the point of this screen, and it is deliberately the
 * *same* CapacityMeter the member sees on their own dashboard, fed by the same calculation
 * through `capacity_for_membership` (migration 012). Both sides of a lending decision look at one
 * honest number, drawn one honest way — a second visual here would quietly imply a second truth.
 *
 * What it never shows is which cooperatives make up the committed figure, or what this member
 * holds at any of them. That is not a UI choice: the function returns an aggregate and nothing
 * else, so the screen could not show more if it tried (DECISIONS.md D003).
 */
export function MemberProfileView({
  profile,
  canRecord,
}: {
  profile: MemberProfile;
  /**
   * Officer blueprint 5.2: the actions at the bottom of each tab "reflect this Officer's specific
   * permissions" — Record contribution and Record repayment appear only where that permission is
   * granted. What they read stays identical either way, including the cross-cooperative
   * eligibility panel, "never a lesser or delayed version of it".
   */
  canRecord: boolean;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const reduceMotion = useReducedMotion();

  const activeLoans = profile.loans.filter((loan) => loan.status === "active");
  const loanBalance = activeLoans.reduce(
    (total, loan) => total + Math.max(loan.requestedAmount - loan.repaid, 0),
    0,
  );

  return (
    <div>
      <header className="flex flex-wrap items-start gap-4">
        <IdentityMark name={profile.name} className="size-14 shrink-0" />

        <div className="min-w-0 flex-1">
          <h1 className="type-page-title text-text">{profile.name ?? "Member"}</h1>
          <p className="type-secondary mt-1 text-text-secondary">
            {profile.employeeId ? `Staff ID ${profile.employeeId}` : "No staff ID recorded"}
            {profile.joinedAt ? ` · Joined ${formatDate(profile.joinedAt)}` : ""}
            {profile.status === "pending" ? " · Application not yet approved" : ""}
          </p>
        </div>
      </header>

      {/* Continuous Tabs, the pill switcher the design system specifies. The moving pill is a
          layout animation on the one standard spring — the same physics as everything else. */}
      <div
        role="tablist"
        aria-label="Member record"
        className="mt-8 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1"
      >
        {TABS.map((entry) => {
          const selected = tab === entry;

          return (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(entry)}
              className={cn(
                "relative rounded-full px-4 py-2 type-secondary font-medium whitespace-nowrap transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
                selected ? "text-text" : "text-text-muted hover:text-text-secondary",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId="member-tab"
                  aria-hidden
                  transition={reduceMotion ? { duration: 0 } : springStandard}
                  className="absolute inset-0 rounded-full bg-background"
                />
              ) : null}
              <span className="relative">{TAB_LABELS[entry]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {tab === "overview" ? (
          <Overview profile={profile} loanBalance={loanBalance} />
        ) : tab === "savings" ? (
          <Savings profile={profile} canRecord={canRecord} />
        ) : tab === "loans" ? (
          <Loans profile={profile} canRecord={canRecord} />
        ) : (
          <Deductions />
        )}
      </div>
    </div>
  );
}

function Overview({ profile, loanBalance }: { profile: MemberProfile; loanBalance: number }) {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="type-caption uppercase tracking-[0.06em] text-text-muted">
            Savings with you
          </p>
          <RollingNumber value={profile.savingsBalance} className="type-kpi mt-3 text-text" />
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <p className="type-caption uppercase tracking-[0.06em] text-text-muted">
            Loan balance with you
          </p>
          <RollingNumber value={loanBalance} className="type-kpi mt-3 text-text" />
        </div>
      </div>

      <section className="mt-6 rounded-feature border border-border bg-surface p-5 md:p-6">
        <h2 className="type-section text-text">What this member can carry</h2>

        {profile.capacity && profile.salaryConfirmed ? (
          <>
            <div className="mt-5">
              <CapacityMeter
                cap={profile.capacity.cap}
                committed={profile.capacity.committed}
                caption="Their agreed monthly deduction limit, and what is still free of it."
              />
            </div>

            <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <div>
                <dt className="type-caption text-text-muted">Monthly limit</dt>
                <dd className="type-card-title tabular mt-1 text-text">
                  {formatNaira(profile.capacity.cap)}
                </dd>
              </div>
              <div>
                <dt className="type-caption text-text-muted">Already committed</dt>
                <dd className="type-card-title tabular mt-1 text-text">
                  {formatNaira(profile.capacity.committed)}
                </dd>
              </div>
              <div>
                <dt className="type-caption text-text-muted">Still available</dt>
                <dd className="type-card-title tabular mt-1 text-text">
                  {formatNaira(profile.capacity.available)}
                </dd>
              </div>
            </dl>

            <p className="type-caption mt-5 max-w-[560px] text-text-muted">
              Committed covers every cooperative this member belongs to, including yours. Clarix
              does not tell you which cooperatives those are, what they hold, or what they lent —
              only the total, because that is all you need to lend responsibly and all they agreed
              to share.
            </p>
          </>
        ) : (
          <p className="type-body mt-3 max-w-[520px] text-text-secondary">
            This member has not confirmed a salary on Clarix yet, so there is no limit to measure
            a loan against. They confirm it from a payslip on their own Profile screen; until then
            any lending decision here is outside what Clarix can check.
          </p>
        )}
      </section>
    </div>
  );
}

function Savings({ profile, canRecord }: { profile: MemberProfile; canRecord: boolean }) {
  const entries = profile.ledger.filter(
    (entry) => entry.type === "contribution" || entry.type === "withdrawal_record",
  );

  // Running balance computed oldest-first, then shown newest-first, so each row reads as the
  // balance immediately after that entry — the same shape as the member's own statement.
  const oldestFirst = [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const withBalances = oldestFirst.reduce<Array<(typeof entries)[number] & { balance: number }>>(
    (accumulated, entry) => {
      const previous = accumulated.at(-1)?.balance ?? 0;
      const balance = previous + (entry.type === "contribution" ? entry.amount : -entry.amount);
      return [...accumulated, { ...entry, balance }];
    },
    [],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Contributions</h2>
        {canRecord ? (
          <Button
            size="sm"
            render={
              <Link href={`/admin/members/${profile.membershipId}/record?type=contribution`} />
            }
          >
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            Record contribution
          </Button>
        ) : null}
      </div>

      {withBalances.length === 0 ? (
        <p className="type-body mt-4 text-text-secondary">
          Nothing recorded yet. What you record here is what this member sees on their own
          statement.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Date
                </th>
                <th scope="col" className="pb-3 pr-4 type-caption uppercase tracking-[0.08em] text-text-muted">
                  Entry
                </th>
                <th scope="col" className="pb-3 pr-4 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                  Amount
                </th>
                <th scope="col" className="pb-3 text-right type-caption uppercase tracking-[0.08em] text-text-muted">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {withBalances.toReversed().map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-b-0">
                  <td className="py-3 pr-4 type-secondary whitespace-nowrap text-text-secondary">
                    {formatDate(entry.recordedAt)}
                  </td>
                  <td className="py-3 pr-4 type-secondary text-text">
                    {entry.description ??
                      (entry.type === "contribution" ? "Contribution" : "Withdrawal recorded")}
                  </td>
                  <td className="py-3 pr-4 text-right type-secondary tabular text-text">
                    {entry.type === "contribution" ? "+" : "−"}
                    {formatNaira(entry.amount)}
                  </td>
                  <td className="py-3 text-right type-secondary tabular font-medium text-text">
                    {formatNaira(entry.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Loans({ profile, canRecord }: { profile: MemberProfile; canRecord: boolean }) {
  const repayable = profile.loans.filter((loan) => loan.status === "active");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="type-section text-text">Loans with this cooperative</h2>
        {canRecord && repayable.length > 0 ? (
          <Button
            size="sm"
            variant="outline"
            render={
              <Link href={`/admin/members/${profile.membershipId}/record?type=loan_repayment`} />
            }
          >
            <Plus className="size-4" aria-hidden strokeWidth={2.5} />
            Record repayment
          </Button>
        ) : null}
      </div>

      {profile.loans.length === 0 ? (
        <p className="type-body mt-4 text-text-secondary">
          No loan has ever been recorded for this member here.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border rounded-feature border border-border bg-surface">
          {profile.loans.map((loan) => (
            <li key={loan.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
              <span
                aria-hidden
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-card border border-border text-text-muted"
              >
                <Receipt className="size-4" strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="type-card-title tabular text-text">
                  {formatNaira(loan.requestedAmount)} over {loan.tenureMonths} months
                </p>
                <p className="type-secondary mt-1 text-text-secondary">
                  {formatNaira(loan.monthlyRepayment)} a month ·{" "}
                  {loan.status === "active"
                    ? `${formatNaira(loan.repaid)} repaid so far`
                    : describeStatus(loan.status, loan.reservationExpiresAt)}
                </p>
              </div>

              <span className="type-caption whitespace-nowrap text-text-muted">
                {formatDate(loan.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="type-caption mt-4 max-w-[560px] text-text-muted">
        Deciding an application — approving, or turning it down — is the Loans area, which is the
        next part of Clarix being built. Recording what payroll has already taken works today.
      </p>
    </div>
  );
}

function Deductions() {
  return (
    <div>
      <h2 className="type-section text-text">Deductions</h2>
      <p className="type-body mt-3 max-w-[560px] text-text-secondary">
        Month by month, what Clarix expected payroll to deduct for this member against what
        actually arrived. It fills from the monthly reconciliation entry, which is part of the
        cooperative-configuration work still to come — so there is nothing to show here yet
        rather than a table of zeroes.
      </p>
    </div>
  );
}

function describeStatus(status: string, expiresAt: string | null): string {
  if (status === "reserved") {
    return expiresAt
      ? `Waiting on your decision, held until ${formatDate(expiresAt)}`
      : "Waiting on your decision";
  }
  if (status === "completed") return "Fully repaid";
  if (status === "rejected") return "Turned down";
  if (status === "expired") return "The hold lapsed before a decision";
  return status;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
