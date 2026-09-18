"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Clock, Inbox, TriangleAlert } from "lucide-react";
import { MeterBar } from "@/components/clarix/meter-bar";
import { cn } from "@/lib/utils";
import { clampRatio, formatNaira } from "@/lib/format";
import { springStandard } from "@/lib/motion";
import type { LoanApplication } from "@/lib/supabase/admin-loans";

/**
 * Loan Applications Queue (admin blueprint 6.1).
 *
 * Oldest first, "since these are waiting". Each card carries the eligibility answer at a glance
 * rather than behind a tap, because the question that decides which application to open first is
 * exactly whether this one fits.
 *
 * A reservation close to lapsing is flagged in amber: an un-actioned hold releases itself, and a
 * request somebody is waiting on quietly disappearing is the wrong outcome.
 */
export function ApplicationQueue({
  pending,
  decided,
}: {
  pending: LoanApplication[];
  decided: LoanApplication[];
}) {
  const [tab, setTab] = useState<"pending" | "decided">("pending");
  const reduceMotion = useReducedMotion();

  const items = tab === "pending" ? pending : decided;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Applications"
        className="flex w-fit gap-1 rounded-full border border-border bg-surface p-1"
      >
        {(["pending", "decided"] as const).map((entry) => {
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
                  layoutId="queue-tab"
                  aria-hidden
                  transition={reduceMotion ? { duration: 0 } : springStandard}
                  className="absolute inset-0 rounded-full bg-background"
                />
              ) : null}
              <span className="relative">
                {entry === "pending"
                  ? `Waiting${pending.length > 0 ? ` (${pending.length})` : ""}`
                  : "Recently decided"}
              </span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-feature border border-border bg-surface px-6 py-10 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Inbox className="size-5" strokeWidth={1.75} />
          </span>
          <p className="type-body mt-5 text-text">
            {tab === "pending" ? "Nothing is waiting on a decision" : "Nothing decided yet"}
          </p>
          <p className="type-secondary mx-auto mt-2 max-w-[420px] text-text-secondary">
            {tab === "pending"
              ? "When a member applies, their request appears here with the eligibility answer already worked out."
              : "Approvals and rejections move here once you have made them."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} decided={tab === "decided"} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationCard({
  application,
  decided,
}: {
  application: LoanApplication;
  decided: boolean;
}) {
  const expiringSoon =
    !decided && application.expiresInDays !== null && application.expiresInDays <= 2;

  return (
    <Link
      href={`/admin/loans/${application.id}`}
      className={cn(
        "block rounded-feature border bg-surface p-5 transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-indigo focus-visible:outline-offset-2",
        expiringSoon ? "border-warning/40" : "border-border hover:border-text-muted/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-card-title text-text">
            {application.memberName ?? application.employeeId ?? "A member"}
          </p>
          <p className="type-secondary mt-1 tabular text-text-secondary">
            {formatNaira(application.requestedAmount)} over {application.tenureMonths} months ·{" "}
            {formatNaira(application.monthlyRepayment)} a month
          </p>
        </div>

        {decided ? (
          <span className="type-caption whitespace-nowrap text-text-muted">
            {describeDecision(application.status)}
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-2 type-caption whitespace-nowrap",
              expiringSoon ? "text-warning" : "text-text-muted",
            )}
          >
            {expiringSoon ? (
              <TriangleAlert aria-hidden strokeWidth={2} className="size-3.5" />
            ) : (
              <Clock aria-hidden strokeWidth={1.75} className="size-3.5" />
            )}
            {application.waitingDays === 0
              ? "Applied today"
              : `Waiting ${application.waitingDays} ${application.waitingDays === 1 ? "day" : "days"}`}
          </span>
        )}
      </div>

      {!decided && application.cap !== null && application.availableBefore !== null ? (
        <div className="mt-4">
          {/* The compact meter, not a second way of drawing the same relationship. */}
          <MeterBar
            size="compact"
            usedRatio={clampRatio((application.committedElsewhere ?? 0) / application.cap)}
            proposedRatio={clampRatio(application.monthlyRepayment / application.cap)}
            tone={application.overCap ? "exceeded" : "healthy"}
            label={`${formatNaira(application.monthlyRepayment)} a month against ${formatNaira(application.availableBefore)} available`}
          />

          <p
            className={cn(
              "mt-2 type-caption",
              application.overCap ? "text-danger" : "text-emerald",
            )}
          >
            {application.overCap
              ? `Exceeds what is left of their limit by ${formatNaira(application.monthlyRepayment - application.availableBefore)} a month`
              : `Fits, with ${formatNaira(application.availableBefore - application.monthlyRepayment)} a month still free`}
          </p>
        </div>
      ) : null}

      {expiringSoon ? (
        <p className="mt-3 type-caption text-warning">
          {application.expiresInDays !== null && application.expiresInDays <= 0
            ? "The hold lapses today."
            : `The hold lapses in ${application.expiresInDays} ${application.expiresInDays === 1 ? "day" : "days"}.`}
        </p>
      ) : null}
    </Link>
  );
}

function describeDecision(status: string): string {
  if (status === "active") return "Approved";
  if (status === "rejected") return "Turned down";
  if (status === "completed") return "Repaid in full";
  if (status === "expired") return "Hold lapsed";
  return status;
}
