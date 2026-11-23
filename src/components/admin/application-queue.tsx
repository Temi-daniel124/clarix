"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Inbox, TriangleAlert } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { MeterBar } from "@/components/clarix/meter-bar";
import { cn } from "@/lib/utils";
import { clampRatio, formatNaira } from "@/lib/format";
import type { LoanApplication } from "@/lib/supabase/admin-loans";
import { queueSegments, type QueueSegment } from "@/lib/home-figures";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { LapsedNotice } from "./lapsed-notice";

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
  lapsed,
  cooperativeId,
  canTidy,
}: {
  pending: LoanApplication[];
  decided: LoanApplication[];
  /** Reservations whose hold ran out before anyone decided (BUILD-PLAN 0.5 rule 3). */
  lapsed: LoanApplication[];
  cooperativeId: string;
  /** Moving lapsed holds out of the queue needs the permission to decide loans. */
  canTidy: boolean;
}) {
  const [tab, setTab] = useState<QueueSegment>("pending");
  const [tidied, setTidied] = useState<number | null>(null);

  // Lapsed is its own segment with its own count, never a banner above a list that says nothing
  // is waiting. It is only offered while it holds something.
  const segments = queueSegments({ pending: pending.length, lapsed: lapsed.length });
  const current = segments.some((segment) => segment.value === tab) ? tab : "decided";

  const items = current === "pending" ? pending : current === "lapsed" ? lapsed : decided;

  return (
    <div>
      <SegmentedControl
        role="tabs"
        label="Applications"
        segments={segments}
        value={current}
        onChange={(next) => {
          setTidied(null);
          setTab(next);
        }}
      />

      {current === "lapsed" && canTidy ? (
        <LapsedNotice
          cooperativeId={cooperativeId}
          count={lapsed.length}
          onTidied={(count) => {
            setTidied(count);
            setTab("decided");
          }}
        />
      ) : null}

      {current === "decided" && tidied !== null && tidied > 0 ? (
        <p role="status" className="mt-6 type-secondary text-text-secondary">
          {tidied === 1
            ? "One lapsed request moved here."
            : `${tidied} lapsed requests moved here.`}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-6 rounded-feature border border-border bg-surface px-6 py-10 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-12 items-center justify-center rounded-card border border-border text-text-muted"
          >
            <Inbox className="size-5" strokeWidth={1.75} />
          </span>
          <p className="type-body mt-5 text-text">
            {current === "pending" ? "Nothing is waiting on a decision" : "Nothing decided yet"}
          </p>
          <p className="type-secondary mx-auto mt-2 max-w-[420px] text-text-secondary">
            {current === "pending"
              ? "New applications appear here with the eligibility answer worked out."
              : "Approvals and rejections move here once you have made them."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} decided={current !== "pending"} />
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
          {!decided && application.overCapacity ? (
            <AboveLimitChip application={application} className="mt-3" />
          ) : null}
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
              application.overCapacity
                ? "text-text-secondary"
                : application.overCap
                  ? "text-danger"
                  : "text-emerald",
            )}
          >
            {application.overCapacity
              ? "Nothing is held for them. Approving needs a written reason."
              : application.overCap
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

/**
 * "Above limit by ₦X" (D040). The figure is today's, measured against what the member has left
 * now; if room has opened up since they sent it, the chip says what was true when they did.
 */
export function AboveLimitChip({
  application,
  className,
}: {
  application: Pick<
    LoanApplication,
    "overCap" | "monthlyRepayment" | "availableBefore" | "shortfallAtSubmission"
  >;
  className?: string;
}) {
  const liveShortfall =
    application.overCap && application.availableBefore !== null
      ? application.monthlyRepayment - application.availableBefore
      : null;

  const label =
    liveShortfall !== null
      ? `Above limit by ${formatNaira(liveShortfall)}`
      : application.shortfallAtSubmission !== null
        ? `Was above limit by ${formatNaira(application.shortfallAtSubmission)}`
        : "Above limit";

  return (
    <Chip tone="stop" icon={<TriangleAlert aria-hidden />} className={className}>
      {label}
    </Chip>
  );
}

function describeDecision(status: string): string {
  if (status === "active") return "Approved";
  if (status === "rejected") return "Turned down";
  if (status === "completed") return "Repaid in full";
  if (status === "expired") return "Hold lapsed";
  // A reservation still stored as reserved whose hold has run out: the Lapsed segment.
  if (status === "reserved") return "Hold lapsed";
  return status;
}
