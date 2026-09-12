"use client";

import Link from "next/link";
import { ArrowLeft, Check, Clock, TriangleAlert, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapacityMeter } from "@/components/clarix/capacity-meter";
import { MeterBar } from "@/components/clarix/meter-bar";
import { RollingNumber } from "@/components/clarix/rolling-number";
import { cn } from "@/lib/utils";
import { clampRatio, formatNaira } from "@/lib/format";
import { LoanDecision } from "./loan-decision";
import type { LoanApplication } from "@/lib/supabase/admin-loans";

type Application = LoanApplication & {
  savingsBalance: number;
  product: { name: string; minSavingsRatio: number; maxTenureMonths: number } | null;
  salaryConfirmed: boolean;
};

/**
 * Loan Application Review / Eligibility Check — admin blueprint 6.2, and Loan Detail (6.4) once
 * a decision has been made.
 *
 * The eligibility comparison is the *same* CapacityMeter an employee sees previewing their own
 * request, fed by the same calculation: "both sides of this decision deserve to be looking at the
 * same honest number". What differs is only that this side can act on it.
 *
 * Two separate checks sit side by side beneath it, because they answer different questions and
 * both matter: the deduction cap is about the member's salary, and the savings ratio is about
 * this cooperative's own rule. A request can pass one and fail the other.
 */
export function LoanReview({
  application,
  canDecide,
}: {
  application: Application;
  canDecide: boolean;
}) {
  const pending = application.status === "reserved";
  const requiredSavings = application.product
    ? application.requestedAmount * application.product.minSavingsRatio
    : null;
  const savingsShortfall =
    requiredSavings === null ? null : Math.max(requiredSavings - application.savingsBalance, 0);

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2" render={<Link href="/admin/loans" />}>
        <ArrowLeft className="size-4" aria-hidden strokeWidth={2} />
        Applications
      </Button>

      <header className="mt-6">
        <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
          {pending ? "Waiting on your decision" : describeStatus(application.status)}
        </p>
        <h1 className="type-page-title mt-1 text-text">
          {application.memberName ?? application.employeeId ?? "A member"}
        </h1>
        <p className="type-secondary mt-2 tabular text-text-secondary">
          {formatNaira(application.requestedAmount)} over {application.tenureMonths} months ·{" "}
          {formatNaira(application.monthlyRepayment)} a month
        </p>

        {pending && application.expiresInDays !== null ? (
          <p
            className={cn(
              "mt-3 flex items-center gap-2 type-caption",
              application.expiresInDays <= 2 ? "text-warning" : "text-text-muted",
            )}
          >
            {application.expiresInDays <= 2 ? (
              <TriangleAlert aria-hidden strokeWidth={2} className="size-3.5" />
            ) : (
              <Clock aria-hidden strokeWidth={1.75} className="size-3.5" />
            )}
            {application.expiresInDays <= 0
              ? "The hold on their capacity lapses today."
              : `The hold on their capacity lapses in ${application.expiresInDays} ${application.expiresInDays === 1 ? "day" : "days"}.`}
          </p>
        ) : null}
      </header>

      {/* The eligibility answer, drawn the way the member saw it when they applied. */}
      <section className="mt-8 rounded-feature border border-border bg-surface p-5 md:p-6">
        {application.cap !== null && application.salaryConfirmed ? (
          <CapacityMeter
            cap={application.cap}
            committed={application.committedElsewhere ?? 0}
            proposed={application.monthlyRepayment}
            showVerdict
            caption={
              application.overCap
                ? `This is ${formatNaira(application.monthlyRepayment - (application.availableBefore ?? 0))} a month beyond what is left of their limit.`
                : `Approving leaves ${formatNaira((application.availableBefore ?? 0) - application.monthlyRepayment)} a month still free.`
            }
          />
        ) : (
          <p className="type-body text-text-secondary">
            This member has not confirmed a salary on Clarix, so there is no limit to measure the
            request against. Whatever you decide here is outside what Clarix can check.
          </p>
        )}

        <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <dt className="type-caption text-text-muted">Committed elsewhere</dt>
            <dd className="type-card-title tabular mt-1 text-text">
              {application.committedElsewhere === null
                ? "—"
                : formatNaira(application.committedElsewhere)}
            </dd>
          </div>
          <div>
            <dt className="type-caption text-text-muted">Available before this</dt>
            <dd className="type-card-title tabular mt-1 text-text">
              {application.availableBefore === null
                ? "—"
                : formatNaira(application.availableBefore)}
            </dd>
          </div>
          <div>
            <dt className="type-caption text-text-muted">This request</dt>
            <dd className="type-card-title tabular mt-1 text-text">
              {formatNaira(application.monthlyRepayment)}
            </dd>
          </div>
        </dl>

        <p className="type-caption mt-4 max-w-[560px] text-text-muted">
          Committed covers every cooperative this member belongs to. Clarix never tells you which
          ones, or what they hold there — only the total, which is what makes this figure worth
          trusting from both sides.
        </p>
      </section>

      {/* The cooperative's own rule, which is a separate question from the salary cap. */}
      <section className="mt-6 rounded-feature border border-border bg-surface p-5 md:p-6">
        <h2 className="type-section text-text">Your savings rule</h2>

        {application.product && requiredSavings !== null ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="type-caption text-text-muted">Saved with you</p>
                <RollingNumber
                  value={application.savingsBalance}
                  className="type-kpi mt-2 text-text"
                />
              </div>
              <div>
                <p className="type-caption text-text-muted">
                  {application.product.name} requires{" "}
                  {Math.round(application.product.minSavingsRatio * 100)}%
                </p>
                <p className="type-kpi tabular mt-2 text-text">{formatNaira(requiredSavings)}</p>
              </div>
            </div>

            <div className="mt-5">
              <MeterBar
                size="compact"
                track="neutral"
                usedRatio={clampRatio(application.savingsBalance / requiredSavings)}
                label={`${formatNaira(application.savingsBalance)} saved against ${formatNaira(requiredSavings)} required`}
              />
            </div>

            <p
              className={cn(
                "mt-3 type-secondary",
                savingsShortfall && savingsShortfall > 0 ? "text-warning" : "text-emerald",
              )}
            >
              {savingsShortfall && savingsShortfall > 0
                ? `${formatNaira(savingsShortfall)} short of your own requirement.`
                : "Meets your savings requirement."}
            </p>
          </>
        ) : (
          <p className="type-body mt-3 max-w-[520px] text-text-secondary">
            This application was not tied to one of your loan products, so there is no savings
            ratio to check it against. They hold {formatNaira(application.savingsBalance)} with
            you.
          </p>
        )}
      </section>

      <div className="mt-8">
        {pending ? (
          <LoanDecision
            loanId={application.id}
            memberName={application.memberName ?? "This member"}
            monthlyRepayment={application.monthlyRepayment}
            availableBefore={application.availableBefore}
            overCap={application.overCap}
            canDecide={canDecide}
          />
        ) : (
          <div className="rounded-feature border border-border bg-surface p-6">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-card border border-border text-text-muted"
            >
              <Check className="size-4" strokeWidth={2.5} />
            </span>
            <p className="type-card-title mt-4 text-text">{describeStatus(application.status)}</p>
            <p className="type-secondary mt-1 text-text-secondary">
              {application.decidedAt ? `On ${formatDate(application.decidedAt)}.` : null} Recording
              repayments against it happens from the member&apos;s record.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          render={<Link href={`/admin/members/${application.membershipId}`} />}
        >
          <UserRound className="size-4" aria-hidden strokeWidth={2} />
          View member profile
        </Button>
      </div>
    </div>
  );
}

function describeStatus(status: string): string {
  if (status === "active") return "Approved";
  if (status === "rejected") return "Turned down";
  if (status === "completed") return "Repaid in full";
  if (status === "expired") return "The hold lapsed before a decision";
  return status;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
